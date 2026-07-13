/* ==========================================================================
   Agentic FacilityOps AI Platform - Interactivity Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLiveDate();
  initSidebar();
  initChartTooltips();
  initConsoleLogs();
  initThemeToggle();
});

// Global state variables for calculations
let currentEnergyKwh = 42850;
let currentCostUSD = 5142.00;
let currentCarbonTons = 18.2;
let activeAlertsCount = 3;
let availableActionsCount = 2;

// Energy rate constant ($ per kWh)
const UTILITY_RATE = 0.12;

/* ==========================================================================
   Live Date Formatting
   ========================================================================== */
function initLiveDate() {
  const dateEl = document.getElementById('live-date');
  if (!dateEl) return;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();
  
  // Use the system date, formatted like "Wednesday, July 8, 2026"
  dateEl.textContent = today.toLocaleDateString('en-US', options);
}

/* ==========================================================================
   Responsive Sidebar & Link Active Toggles
   ========================================================================== */
function initSidebar() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
      sidebar.classList.toggle('active');
      e.stopPropagation();
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== menuToggle) {
        sidebar.classList.remove('active');
      }
    });
  }

  // Active Menu Item switching (Dashboard/Energy Agent/Reports/Settings)
  const navItems = document.querySelectorAll('.sidebar-menu-item:not(.disabled)');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // For demo, prevent link navigation unless we specify pages
      e.preventDefault();
      
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const itemText = item.querySelector('span').textContent.trim();
      
      // Add a line to the console noting user action
      logToConsole('System', `Navigated to section: [${itemText}]`, 'action');
    });
  });
}

/* ==========================================================================
   SVG Line Chart Tooltips
   ========================================================================== */
function initChartTooltips() {
  const nodes = document.querySelectorAll('.chart-node');
  const tooltip = document.getElementById('chart-tooltip');
  const chartParent = document.getElementById('chart-parent');

  if (!tooltip || !chartParent) return;

  nodes.forEach(node => {
    node.addEventListener('mouseover', (e) => {
      const val = node.getAttribute('data-value');
      const day = node.getAttribute('data-day');
      
      tooltip.innerHTML = `<strong>${day}</strong><br>${val}`;
      tooltip.style.opacity = '1';

      positionTooltip(node, tooltip, chartParent);
    });

    node.addEventListener('mousemove', (e) => {
      positionTooltip(node, tooltip, chartParent);
    });

    node.addEventListener('mouseout', () => {
      tooltip.style.opacity = '0';
    });
  });
}

function positionTooltip(node, tooltip, container) {
  // Get coordinate relative to the SVG container
  const nodeRect = node.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  const left = nodeRect.left - containerRect.left + (nodeRect.width / 2);
  const top = nodeRect.top - containerRect.top;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

/* ==========================================================================
   AI Recommendations - Apply Action & KPI Changes
   ========================================================================== */
window.applyRecommendation = function(itemId, savingsKwh, carbonKg) {
  const item = document.getElementById(itemId);
  if (!item) return;

  const btn = item.querySelector('.btn');
  const loader = btn.querySelector('.btn-loader');
  const btnText = btn.querySelector('.btn-text-content');

  // Trigger loading state
  btn.disabled = true;
  btn.style.cursor = 'not-allowed';
  loader.style.display = 'inline-block';
  btnText.style.display = 'none';

  // Simulate server/agent delay
  setTimeout(() => {
    // Transform item to completed applied state
    item.classList.add('applied');
    
    // Replace button with applied badge
    const badge = document.createElement('span');
    badge.className = 'badge badge-success';
    badge.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Applied
    `;
    btn.parentNode.replaceChild(badge, btn);

    // Update variables
    currentEnergyKwh -= savingsKwh;
    currentCostUSD -= (savingsKwh * UTILITY_RATE);
    currentCarbonTons -= (carbonKg / 1000); // 1 kg = 0.001 Ton
    availableActionsCount--;

    // Update KPI UI
    animateValueUpdate('kpi-energy', `${currentEnergyKwh.toLocaleString()} kWh`);
    animateValueUpdate('kpi-cost', `$${currentCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    animateValueUpdate('kpi-carbon', `${currentCarbonTons.toFixed(2)} Tons CO₂`);
    
    // Update recommendations badge count
    const countBadge = document.getElementById('actions-count');
    if (countBadge) {
      if (availableActionsCount > 0) {
        countBadge.textContent = `${availableActionsCount} Available`;
      } else {
        countBadge.textContent = `0 Available`;
        countBadge.className = 'badge badge-neutral';
      }
    }

    // Specific dashboard element modification based on recommendation
    if (itemId === 'rec-hvac') {
      const zoneBTemp = document.getElementById('zone-b-temp');
      const zoneBStatus = document.getElementById('zone-b-status');
      if (zoneBTemp) {
        zoneBTemp.textContent = '72.7°F';
        zoneBTemp.style.transition = 'color 0.5s ease';
        zoneBTemp.style.color = 'var(--color-primary)';
        setTimeout(() => zoneBTemp.style.color = '', 1500);
      }
      if (zoneBStatus) {
        zoneBStatus.textContent = 'Optimized';
        zoneBStatus.className = 'badge badge-success';
      }
      logToConsole('EnergyAgent', 'HVAC setback applied in Zone B. Setpoint changed from 74.2°F to 72.7°F.', 'highlight');
    } else if (itemId === 'rec-chiller') {
      logToConsole('EnergyAgent', 'Chiller sequencing policy updated. Optimized chiller staging configuration loaded.', 'highlight');
    }

  }, 1000);
};

// Smooth UI text transition
function animateValueUpdate(elementId, newValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  el.style.opacity = '0.3';
  el.style.transform = 'scale(0.98)';
  el.style.transition = 'opacity 0.2s, transform 0.2s';
  
  setTimeout(() => {
    el.textContent = newValue;
    el.style.opacity = '1';
    el.style.transform = 'scale(1)';
  }, 200);
}

/* ==========================================================================
   Alerts Management - Dismissal & Counters
   ========================================================================== */
window.dismissAlert = function(alertId) {
  const alertItem = document.getElementById(alertId);
  if (!alertItem) return;

  // Fade and slide transition
  alertItem.style.opacity = '0';
  alertItem.style.transform = 'translateY(-10px)';
  alertItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease, margin 0.3s ease, height 0.3s ease';

  setTimeout(() => {
    alertItem.remove();
    activeAlertsCount--;

    // Update indicators
    updateAlertsCountUI();

    // Log the event to console
    const alertDesc = alertItem.querySelector('.alert-desc').textContent;
    const truncatedDesc = alertDesc.length > 30 ? alertDesc.substring(0, 30) + '...' : alertDesc;
    logToConsole('System', `Alert dismissed: "${truncatedDesc}"`, 'neutral');
  }, 300);
};

function updateAlertsCountUI() {
  const kpiAlerts = document.getElementById('kpi-alerts');
  const alertBadge = document.getElementById('notifications-badge');
  const textAlerts = document.getElementById('alerts-count-text');

  // Update KPI Card
  if (kpiAlerts) {
    if (activeAlertsCount > 0) {
      kpiAlerts.textContent = `${activeAlertsCount} Active`;
    } else {
      kpiAlerts.textContent = `0 Active`;
      // Turn KPI card value green indicating safety
      kpiAlerts.style.color = 'var(--color-success)';
      const kpiCard = kpiAlerts.closest('.kpi-card');
      const trend = kpiCard.querySelector('.kpi-trend');
      if (trend) {
        trend.innerHTML = `<span class="text-success">✓ Clean Health</span>`;
      }
    }
  }

  // Update Notification Bell badge
  if (alertBadge) {
    if (activeAlertsCount > 0) {
      alertBadge.textContent = activeAlertsCount;
    } else {
      alertBadge.remove(); // Remove badge if no alerts remain
    }
  }

  // Update Widget header count text
  if (textAlerts) {
    textAlerts.textContent = `${activeAlertsCount} Active`;
  }
}

/* ==========================================================================
   Simulated Energy Agent Console Log Generator
   ========================================================================== */
const mockConsoleLogs = [
  { agent: 'EnergyAgent', text: 'Initiating zone occupancy correlation analysis...', type: 'normal' },
  { agent: 'EnergyAgent', text: 'Zone B corridor occupancy dropping. Standby setpoints engaged.', type: 'highlight' },
  { agent: 'EnergyAgent', text: 'Peak load predictive model updated for tomorrow. Ambient forecast: 82°F.', type: 'normal' },
  { agent: 'EnergyAgent', text: 'Peak demand window forecasted: 2:00 PM - 5:00 PM. Designing load-shift curve...', type: 'action' },
  { agent: 'EnergyAgent', text: 'Dynamic pricing threshold adjusted. Peak shaving dispatch rate set to 40%.', type: 'normal' },
  { agent: 'EnergyAgent', text: 'Calibration cycle run for West Wing airflow damper matrices. Flow rate optimized.', type: 'highlight' },
  { agent: 'EnergyAgent', text: 'Chiller loop condenser cooling fluid flow adjusted. Temperature difference: 4.8°F.', type: 'normal' },
  { agent: 'EnergyAgent', text: 'Sensor scan: CO₂ levels stable. Range: 420ppm - 610ppm. Zone ventilation rate at 100%.', type: 'normal' },
  { agent: 'EnergyAgent', text: 'Zone A heat load increasing. Modifying pre-cooling duration by 20 mins.', type: 'action' },
  { agent: 'EnergyAgent', text: 'Savings audit: Cumulative carbon mitigation for this week reached 2.4 tons.', type: 'highlight' }
];

let logIndex = 0;

function initConsoleLogs() {
  const container = document.getElementById('console-log');
  if (!container) return;

  // Append logs on a periodic interval
  setInterval(() => {
    const entry = mockConsoleLogs[logIndex];
    logToConsole(entry.agent, entry.text, entry.type);
    
    // Increment circular pointer
    logIndex = (logIndex + 1) % mockConsoleLogs.length;
  }, 4500);
}

function logToConsole(agent, text, type = 'normal') {
  const container = document.getElementById('console-log');
  if (!container) return;

  const line = document.createElement('div');
  line.className = 'console-line';
  
  const now = new Date();
  const timeStr = `[${now.toTimeString().split(' ')[0]}]`;

  let typeClass = '';
  if (type === 'highlight') typeClass = 'highlight';
  if (type === 'action') typeClass = 'action';
  if (type === 'neutral') typeClass = 'neutral';

  line.innerHTML = `
    <span class="console-time">${timeStr}</span>
    <span class="console-agent">${agent}:</span>
    <span class="console-text ${typeClass}">${text}</span>
  `;

  container.appendChild(line);
  
  // Smooth scroll container to the bottom
  container.scrollTop = container.scrollHeight;
}

/* ==========================================================================
   Theme Toggle (Dark / Light Mode)
   ========================================================================== */
function initThemeToggle() {
  const toggleButtons = document.querySelectorAll('#theme-toggle');
  
  // Apply saved theme on page load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    updateToggleIcons(true);
  }

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDarkNow = document.body.classList.toggle('dark-theme');
      
      // Save state
      localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
      
      // Update icons
      updateToggleIcons(isDarkNow);
      
      // Log to console if on dashboard
      logToConsole('System', `Theme configuration updated: [${isDarkNow ? 'Dark' : 'Light'} Mode]`, 'neutral');
    });
  });
}

function updateToggleIcons(isDark) {
  const moons = document.querySelectorAll('.theme-icon-moon');
  const suns = document.querySelectorAll('.theme-icon-sun');
  
  moons.forEach(m => m.style.display = isDark ? 'none' : 'block');
  suns.forEach(s => s.style.display = isDark ? 'block' : 'none');
}
