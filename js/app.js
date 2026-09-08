import { store } from './store.js';

/**
 * Horizon Heights Residency - Application Controller
 */
class HorizonApp {
  constructor() {
    this.currentView = 'dashboard';
    this.theme = localStorage.getItem('horizon_theme') || 'dark';
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalBox = document.getElementById('modal-box');
    this.toastContainer = document.getElementById('toast-container');
    this.viewContainer = document.getElementById('view-container');
    this.pageTitle = document.getElementById('page-title');
    this.roleSelect = document.getElementById('role-select');
    this.btnThemeToggle = document.getElementById('btn-theme-toggle');
    this.btnResetDemo = document.getElementById('btn-reset-demo');
    this.btnHeaderAction = document.getElementById('btn-header-action');
    this.btnHeaderActionLabel = document.getElementById('btn-header-action-label');

    // Filter states
    this.noticesFilter = 'All';
    this.noticesSearch = '';
    this.complaintsFilter = 'All';
    this.complaintsSearch = '';
    this.visitorsFilter = 'All';
    this.visitorsSearch = '';
    this.directoryFilter = 'All';
    this.directorySearch = '';
  }

  async start() {
    this.applyTheme(this.theme);
    await store.init();

    // Subscribe to state changes
    store.subscribe(() => {
      this.updateBadgesAndUser();
      this.renderCurrentView();
    });

    this.bindEvents();
    this.updateBadgesAndUser();
    this.renderCurrentView();
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('horizon_theme', theme);
    if (this.btnThemeToggle) {
      this.btnThemeToggle.innerHTML = theme === 'dark' 
        ? '<i class="fa-solid fa-moon"></i>' 
        : '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>';
    }
  }

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.showToast(`Switched to ${newTheme} mode`, 'info');
  }

  bindEvents() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        this.switchView(view);
      });
    });

    // Theme Toggle
    if (this.btnThemeToggle) {
      this.btnThemeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Reset Demo Data
    if (this.btnResetDemo) {
      this.btnResetDemo.addEventListener('click', async () => {
        if (confirm('Reset all demo data back to default state? Custom edits will be cleared.')) {
          await store.resetToDefault();
          this.showToast('Demo data restored to defaults', 'success');
        }
      });
    }

    // Role Switcher Dropdown
    if (this.roleSelect) {
      this.roleSelect.value = store.getCurrentRole();
      this.roleSelect.addEventListener('change', (e) => {
        const selectedRole = e.target.value;
        store.setRole(selectedRole);
        this.showToast(`Switched active profile to ${selectedRole.toUpperCase()}`, 'info');
      });
    }

    // Top Header Quick Action
    if (this.btnHeaderAction) {
      this.btnHeaderAction.addEventListener('click', () => this.handleHeaderAction());
    }

    // Modal close on backdrop click
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalOverlay.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  updateBadgesAndUser() {
    const state = store.getState();
    if (!state) return;

    // User profile in sidebar
    const user = store.getCurrentUser();
    const role = store.getCurrentRole();

    const nameEl = document.getElementById('user-display-name');
    const metaEl = document.getElementById('user-display-meta');
    const avatarEl = document.getElementById('user-avatar-initials');

    if (nameEl) nameEl.textContent = user.name;
    if (metaEl) metaEl.textContent = `${user.flatNo} • ${user.role}`;
    if (avatarEl) {
      const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      avatarEl.textContent = initials;
    }
    if (this.roleSelect && this.roleSelect.value !== role) {
      this.roleSelect.value = role;
    }

    // Badges in sidebar
    const badgeNotices = document.getElementById('badge-notices');
    if (badgeNotices) badgeNotices.textContent = state.notices.length;

    const badgeComplaints = document.getElementById('badge-complaints');
    if (badgeComplaints) {
      const activeComplaints = state.complaints.filter(c => c.status !== 'Resolved').length;
      badgeComplaints.textContent = activeComplaints;
      badgeComplaints.style.background = activeComplaints > 0 ? 'rgba(244, 63, 94, 0.4)' : '';
    }

    const badgeMaintenance = document.getElementById('badge-maintenance');
    if (badgeMaintenance) {
      const pendingBills = state.maintenance.filter(m => m.status === 'Pending').length;
      badgeMaintenance.textContent = pendingBills;
      badgeMaintenance.style.background = pendingBills > 0 ? 'rgba(245, 158, 11, 0.4)' : '';
    }

    const badgeVisitors = document.getElementById('badge-visitors');
    if (badgeVisitors) {
      const activeVis = state.visitors.filter(v => v.status === 'Approved' || v.status === 'Checked In').length;
      badgeVisitors.textContent = activeVis;
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    const titles = {
      dashboard: 'Community Dashboard',
      notices: 'Notices & Circulars',
      complaints: 'Helpdesk & Complaints',
      maintenance: 'Maintenance & Utility Bills',
      visitors: 'Visitor Pass Management',
      amenities: 'Society Amenities & Bookings',
      polls: 'Community Polls & Voting',
      directory: 'Resident Directory',
      emergency: '24/7 Emergency Contacts',
      backup: 'System & Data Management'
    };

    const actionLabels = {
      dashboard: 'Raise Ticket',
      notices: 'Post Notice',
      complaints: 'Raise Complaint',
      maintenance: 'Pay Dues',
      visitors: 'New Gate Pass',
      amenities: 'Book Amenity',
      polls: 'Create Poll',
      directory: 'Search Residents',
      emergency: 'Call Security Gate',
      backup: 'Export Backup'
    };

    if (this.pageTitle) this.pageTitle.textContent = titles[viewName] || 'Horizon Heights';
    if (this.btnHeaderActionLabel) this.btnHeaderActionLabel.textContent = actionLabels[viewName] || 'Action';

    this.renderCurrentView();
  }

  handleHeaderAction() {
    switch (this.currentView) {
      case 'dashboard':
      case 'complaints':
        this.openRaiseComplaintModal();
        break;
      case 'notices':
        this.openAddNoticeModal();
        break;
      case 'maintenance': {
        const pending = store.getState().maintenance.find(m => m.status === 'Pending');
        if (pending) {
          this.openPayModal(pending.id);
        } else {
          this.showToast('All maintenance bills are fully paid!', 'info');
        }
        break;
      }
      case 'visitors':
        this.openCreateVisitorModal();
        break;
      case 'amenities':
        this.openBookAmenityModal();
        break;
      case 'polls':
        this.openAddPollModal();
        break;
      case 'directory': {
        const searchInput = document.getElementById('directory-search');
        if (searchInput) searchInput.focus();
        break;
      }
      case 'emergency':
        this.triggerEmergencyCall('Main Security Gate Desk', '+91 80000 11111');
        break;
      case 'backup':
        store.exportJSON();
        this.showToast('JSON backup downloaded successfully', 'success');
        break;
    }
  }

  renderCurrentView() {
    if (!this.viewContainer) return;
    switch (this.currentView) {
      case 'dashboard': this.renderDashboard(); break;
      case 'notices': this.renderNotices(); break;
      case 'complaints': this.renderComplaints(); break;
      case 'maintenance': this.renderMaintenance(); break;
      case 'visitors': this.renderVisitors(); break;
      case 'amenities': this.renderAmenities(); break;
      case 'polls': this.renderPolls(); break;
      case 'directory': this.renderDirectory(); break;
      case 'emergency': this.renderEmergency(); break;
      case 'backup': this.renderBackup(); break;
      default: this.renderDashboard();
    }
  }

  // =========================================================================
  // 1. DASHBOARD VIEW
  // =========================================================================
  renderDashboard() {
    const state = store.getState();
    const user = store.getCurrentUser();
    const pendingComplaints = state.complaints.filter(c => c.status !== 'Resolved').length;
    const pendingBill = state.maintenance.find(m => m.status === 'Pending');
    const checkedInVisitors = state.visitors.filter(v => v.status === 'Checked In').length;
    const pinnedNotice = state.notices.find(n => n.pinned);

    let html = `
      <!-- Pinned Urgent Notice Banner -->
      ${pinnedNotice ? `
        <div class="pinned-banner">
          <div class="pinned-banner-content">
            <h4><i class="fa-solid fa-thumbtack" style="color: var(--accent-rose);"></i> ${this.escapeHtml(pinnedNotice.title)}</h4>
            <p>${this.escapeHtml(pinnedNotice.content)}</p>
          </div>
          <button class="action-btn action-btn-primary" id="btn-banner-view" style="white-space: nowrap;">
            <i class="fa-solid fa-eye"></i> View Notices
          </button>
        </div>
      ` : ''}

      <!-- Statistics Overview Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <span>Total Units</span>
            <h3>${state.society.totalFlats}</h3>
            <div class="stat-trend up"><i class="fa-solid fa-check"></i> ${state.society.registeredMembers} Registered</div>
          </div>
          <div class="stat-icon purple">
            <i class="fa-solid fa-building"></i>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Active Notices</span>
            <h3>${state.notices.length}</h3>
            <div class="stat-trend neutral"><i class="fa-solid fa-bullhorn"></i> Official updates</div>
          </div>
          <div class="stat-icon emerald">
            <i class="fa-solid fa-newspaper"></i>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Open Complaints</span>
            <h3>${pendingComplaints}</h3>
            <div class="stat-trend ${pendingComplaints > 0 ? 'warning' : 'up'}">
              <i class="fa-solid ${pendingComplaints > 0 ? 'fa-clock' : 'fa-check'}"></i> 
              ${pendingComplaints > 0 ? 'Requires attention' : 'All resolved'}
            </div>
          </div>
          <div class="stat-icon rose">
            <i class="fa-solid fa-screwdriver-wrench"></i>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span>Maintenance Dues</span>
            <h3>${pendingBill ? '₹' + pendingBill.amount : '₹0'}</h3>
            <div class="stat-trend ${pendingBill ? 'warning' : 'up'}">
              <i class="fa-solid ${pendingBill ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> 
              ${pendingBill ? pendingBill.month : 'All Paid'}
            </div>
          </div>
          <div class="stat-icon amber">
            <i class="fa-solid fa-wallet"></i>
          </div>
        </div>
      </div>

      <!-- Quick Action Shortcuts -->
      <div class="quick-actions-bar">
        <div class="quick-action-chip" id="qa-complaint">
          <i class="fa-solid fa-pen-to-square"></i> Raise Helpdesk Ticket
        </div>
        <div class="quick-action-chip" id="qa-visitor">
          <i class="fa-solid fa-user-check"></i> Pre-Approve Visitor Pass
        </div>
        <div class="quick-action-chip" id="qa-amenity">
          <i class="fa-solid fa-table-tennis-paddle-ball"></i> Book Clubhouse & Sports
        </div>
        ${pendingBill ? `
          <div class="quick-action-chip" id="qa-pay" style="border-color: var(--accent-amber); color: var(--accent-amber);">
            <i class="fa-solid fa-credit-card"></i> Pay Due (₹${pendingBill.amount})
          </div>
        ` : ''}
      </div>

      <!-- Two-column Section: Recent Notices & Helpdesk Activity -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px;">
        <!-- Left: Recent Notices -->
        <div>
          <div class="section-header">
            <h3><i class="fa-solid fa-bullhorn" style="color: var(--accent-primary); margin-right: 8px;"></i> Recent Announcements</h3>
            <button class="action-btn" id="btn-dash-all-notices" style="padding: 6px 12px; font-size: 0.8rem;">View All</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${state.notices.slice(0, 3).map(n => `
              <div class="content-card" style="padding: 18px;">
                <div class="card-header">
                  <h4>${this.escapeHtml(n.title)}</h4>
                  <span class="badge ${this.getBadgeClass(n.priority)}">${n.priority}</span>
                </div>
                <p class="card-body" style="font-size: 0.85rem; margin-bottom: 12px;">${this.escapeHtml(n.content)}</p>
                <div class="card-footer">
                  <span><i class="fa-regular fa-user"></i> ${this.escapeHtml(n.author)}</span>
                  <span><i class="fa-regular fa-calendar"></i> ${n.date}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Active Complaints & Gate Activity -->
        <div>
          <div class="section-header">
            <h3><i class="fa-solid fa-shield-halved" style="color: var(--accent-cyan); margin-right: 8px;"></i> Helpdesk & Security Gate</h3>
            <button class="action-btn" id="btn-dash-all-complaints" style="padding: 6px 12px; font-size: 0.8rem;">View Helpdesk</button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${state.complaints.slice(0, 3).map(c => `
              <div class="content-card" style="padding: 18px;">
                <div class="card-header">
                  <h4>${this.escapeHtml(c.title)}</h4>
                  <span class="badge ${this.getBadgeClass(c.status)}">${c.status}</span>
                </div>
                <p class="card-body" style="font-size: 0.85rem; margin-bottom: 12px;">${this.escapeHtml(c.description)}</p>
                <div class="card-footer">
                  <span><i class="fa-solid fa-location-dot"></i> Flat ${c.flatNo}</span>
                  <span><i class="fa-regular fa-clock"></i> ${c.date}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.viewContainer.innerHTML = html;

    // Attach listeners
    const btnBanner = document.getElementById('btn-banner-view');
    if (btnBanner) btnBanner.addEventListener('click', () => this.switchView('notices'));

    const btnAllNotices = document.getElementById('btn-dash-all-notices');
    if (btnAllNotices) btnAllNotices.addEventListener('click', () => this.switchView('notices'));

    const btnAllComplaints = document.getElementById('btn-dash-all-complaints');
    if (btnAllComplaints) btnAllComplaints.addEventListener('click', () => this.switchView('complaints'));

    const qaComplaint = document.getElementById('qa-complaint');
    if (qaComplaint) qaComplaint.addEventListener('click', () => this.openRaiseComplaintModal());

    const qaVisitor = document.getElementById('qa-visitor');
    if (qaVisitor) qaVisitor.addEventListener('click', () => this.openCreateVisitorModal());

    const qaAmenity = document.getElementById('qa-amenity');
    if (qaAmenity) qaAmenity.addEventListener('click', () => this.openBookAmenityModal());

    const qaPay = document.getElementById('qa-pay');
    if (qaPay && pendingBill) qaPay.addEventListener('click', () => this.openPayModal(pendingBill.id));
  }

  // =========================================================================
  // 2. NOTICES VIEW
  // =========================================================================
  renderNotices() {
    const state = store.getState();
    const categories = ['All', 'Event', 'Maintenance', 'General'];

    let filtered = state.notices.filter(n => {
      const matchCat = this.noticesFilter === 'All' || n.category === this.noticesFilter;
      const matchSearch = !this.noticesSearch || 
        n.title.toLowerCase().includes(this.noticesSearch.toLowerCase()) || 
        n.content.toLowerCase().includes(this.noticesSearch.toLowerCase());
      return matchCat && matchSearch;
    });

    const isAuthorized = store.getCurrentRole() === 'admin';

    let html = `
      <div class="filter-bar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="notices-search-input" placeholder="Search notices by keyword, title..." value="${this.escapeHtml(this.noticesSearch)}">
        </div>
        <div class="filter-pills">
          ${categories.map(c => `
            <div class="pill ${this.noticesFilter === c ? 'active' : ''}" data-cat="${c}">${c}</div>
          `).join('')}
        </div>
        <button class="action-btn action-btn-primary" id="btn-post-notice">
          <i class="fa-solid fa-plus"></i> Post Notice
        </button>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <i class="fa-regular fa-bell-slash"></i>
          <h4>No notices found</h4>
          <p>Try clearing your search criteria or post an official circular.</p>
        </div>
      ` : `
        <div class="card-grid">
          ${filtered.map(n => `
            <div class="content-card">
              <div class="card-header">
                <div>
                  ${n.pinned ? '<span style="color: var(--accent-rose); font-size: 0.75rem; font-weight: 700; margin-bottom: 4px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-thumbtack"></i> PINNED</span>' : ''}
                  <h4>${this.escapeHtml(n.title)}</h4>
                </div>
                <span class="badge ${this.getBadgeClass(n.priority)}">${n.priority}</span>
              </div>
              <p class="card-body">${this.escapeHtml(n.content)}</p>
              <div class="card-footer">
                <div>
                  <span class="badge badge-general" style="font-size: 0.68rem; margin-right: 6px;">${n.category}</span>
                  <span><i class="fa-regular fa-user"></i> ${this.escapeHtml(n.author)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span><i class="fa-regular fa-calendar"></i> ${n.date}</span>
                  ${isAuthorized ? `
                    <button class="icon-btn btn-delete-notice" data-id="${n.id}" title="Delete notice" style="width: 28px; height: 28px; font-size: 0.8rem; color: var(--accent-rose);">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    this.viewContainer.innerHTML = html;

    // Listeners
    const searchInput = document.getElementById('notices-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.noticesSearch = e.target.value;
        this.renderNotices();
      });
    }

    this.viewContainer.querySelectorAll('.filter-pills .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.noticesFilter = pill.dataset.cat;
        this.renderNotices();
      });
    });

    const btnPost = document.getElementById('btn-post-notice');
    if (btnPost) btnPost.addEventListener('click', () => this.openAddNoticeModal());

    this.viewContainer.querySelectorAll('.btn-delete-notice').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Are you sure you want to delete this notice?')) {
          store.deleteNotice(id);
          this.showToast('Notice deleted successfully', 'info');
        }
      });
    });
  }

  openAddNoticeModal() {
    const modalContent = `
      <div class="modal-header">
        <h3><i class="fa-solid fa-bullhorn" style="color: var(--accent-primary);"></i> Publish Notice / Circular</h3>
        <button class="close-btn" id="modal-close">&times;</button>
      </div>
      <form id="form-add-notice">
        <div class="form-group">
          <label for="notice-title">Notice Title</label>
          <input type="text" id="notice-title" class="form-control" placeholder="e.g. Scheduled Water Maintenance" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label for="notice-category">Category</label>
            <select id="notice-category" class="form-control">
              <option value="General">General</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <div class="form-group">
            <label for="notice-priority">Priority</label>
            <select id="notice-priority" class="form-control">
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="notice-content">Circular Content</label>
          <textarea id="notice-content" class="form-control" rows="4" placeholder="Detailed announcement details..." required></textarea>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="notice-pinned" style="accent-color: var(--accent-primary); width: 16px; height: 16px;">
          <label for="notice-pinned" style="margin: 0; text-transform: none; font-size: 0.9rem; cursor: pointer;">
            Pin to top dashboard banner
          </label>
        </div>
        <button type="submit" class="action-btn action-btn-primary" style="width: 100%; justify-content: center; margin-top: 12px;">
          <i class="fa-solid fa-paper-plane"></i> Publish to Community
        </button>
      </form>
    `;

    this.openModal(modalContent, () => {
      const form = document.getElementById('form-add-notice');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('notice-title').value.trim();
        const category = document.getElementById('notice-category').value;
        const priority = document.getElementById('notice-priority').value;
        const content = document.getElementById('notice-content').value.trim();
        const pinned = document.getElementById('notice-pinned').checked;

        store.addNotice({ title, category, priority, content, pinned });
        this.closeModal();
        this.showToast('Notice published successfully!', 'success');
      });
    });
  }

  // =========================================================================
  // 3. COMPLAINTS & HELPDESK VIEW
  // =========================================================================
  renderComplaints() {
    const state = store.getState();
    const statuses = ['All', 'Pending', 'In Progress', 'Resolved'];
    const role = store.getCurrentRole();
    const canUpdateStatus = role === 'admin' || role === 'security';

    let filtered = state.complaints.filter(c => {
      const matchStatus = this.complaintsFilter === 'All' || c.status === this.complaintsFilter;
      const matchSearch = !this.complaintsSearch ||
        c.title.toLowerCase().includes(this.complaintsSearch.toLowerCase()) ||
        c.flatNo.toLowerCase().includes(this.complaintsSearch.toLowerCase()) ||
        c.category.toLowerCase().includes(this.complaintsSearch.toLowerCase());
      return matchStatus && matchSearch;
    });

    let html = `
      <div class="filter-bar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="complaints-search-input" placeholder="Search by issue title, flat number, category..." value="${this.escapeHtml(this.complaintsSearch)}">
        </div>
        <div class="filter-pills">
          ${statuses.map(s => `
            <div class="pill ${this.complaintsFilter === s ? 'active' : ''}" data-status="${s}">${s}</div>
          `).join('')}
        </div>
        <button class="action-btn action-btn-primary" id="btn-raise-complaint">
          <i class="fa-solid fa-plus"></i> Raise Complaint
        </button>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i>
          <h4>No complaints found</h4>
          <p>No complaints match this status. Everything is running smoothly!</p>
        </div>
      ` : `
        <div class="card-grid">
          ${filtered.map(c => `
            <div class="content-card">
              <div class="card-header">
                <div>
                  <span class="badge badge-general" style="font-size: 0.68rem; margin-bottom: 4px; display: inline-block;">${c.category}</span>
                  <h4>${this.escapeHtml(c.title)}</h4>
                </div>
                <span class="badge ${this.getBadgeClass(c.status)}">${c.status}</span>
              </div>
              <p class="card-body">${this.escapeHtml(c.description)}</p>
              
              ${canUpdateStatus ? `
                <div style="margin-bottom: 12px; background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">Update Workflow:</span>
                  <select class="form-control status-update-select" data-id="${c.id}" style="width: auto; padding: 4px 8px; font-size: 0.8rem;">
                    <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                  </select>
                </div>
              ` : ''}

              <div class="card-footer">
                <span><i class="fa-solid fa-house-chimney"></i> Flat ${c.flatNo} • ${this.escapeHtml(c.postedBy)}</span>
                <span class="badge ${this.getBadgeClass(c.priority)}" style="font-size: 0.68rem;">Priority: ${c.priority}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    this.viewContainer.innerHTML = html;

    // Listeners
    const searchInput = document.getElementById('complaints-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.complaintsSearch = e.target.value;
        this.renderComplaints();
      });
    }

    this.viewContainer.querySelectorAll('.filter-pills .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.complaintsFilter = pill.dataset.status;
        this.renderComplaints();
      });
    });

    const btnRaise = document.getElementById('btn-raise-complaint');
    if (btnRaise) btnRaise.addEventListener('click', () => this.openRaiseComplaintModal());

    this.viewContainer.querySelectorAll('.status-update-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.dataset.id;
        const newStatus = e.target.value;
        store.updateComplaintStatus(id, newStatus);
        this.showToast(`Ticket status changed to ${newStatus}`, 'success');
      });
    });
  }

  openRaiseComplaintModal() {
    const user = store.getCurrentUser();
    const modalContent = `
      <div class="modal-header">
        <h3><i class="fa-solid fa-screwdriver-wrench" style="color: var(--accent-primary);"></i> Raise Helpdesk Ticket</h3>
        <button class="close-btn" id="modal-close">&times;</button>
      </div>
      <form id="form-raise-complaint">
        <div class="form-group">
          <label for="cmp-title">Issue Title</label>
          <input type="text" id="cmp-title" class="form-control" placeholder="e.g. Water leak in balcony pipe" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label for="cmp-category">Category</label>
            <select id="cmp-category" class="form-control">
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Elevator / Lift">Elevator / Lift</option>
              <option value="Carpentry & Masonry">Carpentry & Masonry</option>
              <option value="Security / Noise">Security / Noise</option>
              <option value="Housekeeping / Garbage">Housekeeping / Garbage</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="cmp-priority">Priority</label>
            <select id="cmp-priority" class="form-control">
              <option value="Low">Low</option>
              <option value="Medium" selected>Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="cmp-desc">Detailed Description</label>
          <textarea id="cmp-desc" class="form-control" rows="4" placeholder="Explain the issue, exact location, or when it started..." required></textarea>
        </div>
        <div style="background: rgba(0,0,0,0.15); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 0.8rem; color: var(--text-secondary);">
          <i class="fa-solid fa-user-circle"></i> Logged under: <strong>${user.name}</strong> (Flat <strong>${user.flatNo}</strong>)
        </div>
        <button type="submit" class="action-btn action-btn-primary" style="width: 100%; justify-content: center;">
          <i class="fa-solid fa-paper-plane"></i> Submit Ticket
        </button>
      </form>
    `;

    this.openModal(modalContent, () => {
      const form = document.getElementById('form-raise-complaint');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('cmp-title').value.trim();
        const category = document.getElementById('cmp-category').value;
        const priority = document.getElementById('cmp-priority').value;
        const description = document.getElementById('cmp-desc').value.trim();

        store.addComplaint({ title, category, priority, description });
        this.closeModal();
        this.showToast('Helpdesk ticket logged successfully! Assigned to maintenance team.', 'success');
      });
    });
  }

  // =========================================================================
  // 4. MAINTENANCE & BILLS VIEW
  // =========================================================================
  renderMaintenance() {
    const state = store.getState();
    const bills = state.maintenance;
    const pendingBill = bills.find(b => b.status === 'Pending');

    let html = `
      <div class="pinned-banner" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%); border-color: rgba(245, 158, 11, 0.3);">
        <div class="pinned-banner-content">
          <h4 style="color: ${pendingBill ? '#fbbf24' : '#34d399'};">
            <i class="fa-solid ${pendingBill ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i> 
            ${pendingBill ? `Outstanding Bill: ₹${pendingBill.amount}` : 'All Dues Paid in Full'}
          </h4>
          <p>${pendingBill ? `Payment for ${pendingBill.month} is due by ${pendingBill.dueDate}. Avoid late surcharge by paying online.` : 'You have no outstanding society maintenance bills.'}</p>
        </div>
        ${pendingBill ? `
          <button class="action-btn action-btn-primary btn-pay-bill" data-id="${pendingBill.id}" style="white-space: nowrap;">
            <i class="fa-solid fa-credit-card"></i> Pay Now (₹${pendingBill.amount})
          </button>
        ` : ''}
      </div>

      <div class="section-header">
        <h3><i class="fa-solid fa-clock-rotate-left" style="color: var(--accent-primary); margin-right: 8px;"></i> Billing Records & Receipts</h3>
      </div>

      <div class="card-grid">
        ${bills.map(b => `
          <div class="content-card">
            <div class="card-header">
              <div>
                <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Monthly Maintenance</span>
                <h4>${b.month}</h4>
              </div>
              <span class="badge ${this.getBadgeClass(b.status)}">${b.status}</span>
            </div>

            <div style="font-size: 1.8rem; font-weight: 800; font-family: 'Outfit'; color: var(--text-primary); margin: 6px 0 14px 0;">
              ₹${b.amount.toLocaleString()}
            </div>

            <div class="receipt-card" style="margin: 0 0 14px 0; padding: 12px 14px;">
              ${Object.entries(b.breakdown || {}).map(([key, val]) => `
                <div class="receipt-row" style="padding: 4px 0; font-size: 0.8rem;">
                  <span>${key}</span>
                  <span>₹${val}</span>
                </div>
              `).join('')}
            </div>

            <div class="card-footer" style="padding-top: 12px;">
              <div>
                ${b.status === 'Paid' ? `
                  <span style="color: var(--accent-emerald);"><i class="fa-solid fa-check"></i> Paid on ${b.paidDate}</span>
                ` : `
                  <span style="color: var(--accent-amber);"><i class="fa-regular fa-clock"></i> Due by ${b.dueDate}</span>
                `}
              </div>
              <div>
                ${b.status === 'Paid' ? `
                  <button class="action-btn btn-view-receipt" data-id="${b.id}" style="padding: 6px 12px; font-size: 0.8rem;">
                    <i class="fa-solid fa-receipt"></i> Receipt
                  </button>
                ` : `
                  <button class="action-btn action-btn-primary btn-pay-bill" data-id="${b.id}" style="padding: 6px 14px; font-size: 0.8rem;">
                    <i class="fa-solid fa-wallet"></i> Pay
                  </button>
                `}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.viewContainer.innerHTML = html;

    // Attach click events
    this.viewContainer.querySelectorAll('.btn-pay-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.openPayModal(id);
      });
    });

    this.viewContainer.querySelectorAll('.btn-view-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.openReceiptModal(id);
      });
    });
  }

  openPayModal(billId) {
    const bill = store.getState().maintenance.find(m => m.id === billId);
    if (!bill) return;

    const user = store.getCurrentUser();

    const modalContent = `
      <div class="modal-header">
        <h3><i class="fa-solid fa-shield-check" style="color: var(--accent-emerald);"></i> Express Checkout</h3>
        <button class="close-btn" id="modal-close">&times;</button>
      </div>
      <div>
        <div style="background: rgba(0,0,0,0.15); padding: 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="color: var(--text-secondary); font-size: 0.85rem;">Bill Description</span>
            <strong style="color: var(--text-primary);">${bill.month} Maintenance</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="color: var(--text-secondary); font-size: 0.85rem;">Flat & Member</span>
            <strong style="color: var(--text-primary);">${user.flatNo} (${user.name})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
            <span style="font-weight: 700; color: var(--text-primary);">Total Payable</span>
            <span style="font-size: 1.4rem; font-weight: 800; color: var(--accent-cyan);">₹${bill.amount.toLocaleString()}</span>
          </div>
        </div>

        <label style="font-size: 0.82rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary);">Select Payment Mode</label>
        <div class="payment-methods">
          <div class="pay-method-item active" data-method="upi">
            <i class="fa-solid fa-qrcode"></i>
            <span>Instant UPI / QR</span>
          </div>
          <div class="pay-method-item" data-method="card">
            <i class="fa-regular fa-credit-card"></i>
            <span>Cards</span>
          </div>
          <div class="pay-method-item" data-method="netbanking">
            <i class="fa-solid fa-building-columns"></i>
            <span>NetBanking</span>
          </div>
        </div>

        <div id="payment-field-details" style="margin-bottom: 18px;">
          <div class="form-group">
            <label>UPI ID / VPA</label>
            <input type="text" class="form-control" value="john.doe@okaxis" id="upi-input" placeholder="e.g. resident@upi">
          </div>
        </div>

        <button id="btn-process-payment" class="action-btn action-btn-primary" style="width: 100%; justify-content: center; padding: 12px; font-size: 0.95rem;">
          <i class="fa-solid fa-lock"></i> Authorize & Pay ₹${bill.amount.toLocaleString()}
        </button>
      </div>
    `;

    this.openModal(modalContent, () => {
      // Payment method selection
      const methods = document.querySelectorAll('.pay-method-item');
      methods.forEach(m => {
        m.addEventListener('click', () => {
          methods.forEach(x => x.classList.remove('active'));
          m.classList.add('active');
          const method = m.dataset.method;
          const container = document.getElementById('payment-field-details');
          if (method === 'upi') {
            container.innerHTML = `
              <div class="form-group">
                <label>UPI ID / VPA</label>
                <input type="text" class="form-control" value="john.doe@okaxis" id="upi-input">
              </div>
            `;
          } else if (method === 'card') {
            container.innerHTML = `
              <div class="form-group">
                <label>Card Number</label>
                <input type="text" class="form-control" value="4532 •••• •••• 8842">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="form-group">
                  <label>Expiry (MM/YY)</label>
                  <input type="text" class="form-control" value="09/29">
                </div>
                <div class="form-group">
                  <label>CVV</label>
                  <input type="password" class="form-control" value="882">
                </div>
              </div>
            `;
          } else {
            container.innerHTML = `
              <div class="form-group">
                <label>Select Bank</label>
                <select class="form-control">
                  <option>HDFC Bank</option>
                  <option>State Bank of India</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            `;
          }
        });
      });

      const btnPay = document.getElementById('btn-process-payment');
      btnPay.addEventListener('click', () => {
        btnPay.disabled = true;
        btnPay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Secure Payment...';

        setTimeout(() => {
          const updated = store.payMaintenance(billId);
          this.closeModal();
          this.showToast('Payment successful! Transaction confirmed.', 'success');
          this.openReceiptModal(billId);
        }, 900);
      });
    });
  }

  openReceiptModal(billId) {
    const bill = store.getState().maintenance.find(m => m.id === billId);
    if (!bill) return;
    const user = store.getCurrentUser();
    const society = store.getState().society;

    const modalContent = `
      <div class="modal-header">
        <h3><i class="fa-solid fa-receipt" style="color: var(--accent-emerald);"></i> Payment Receipt</h3>
        <button class="close-btn" id="modal-close">&times;</button>
      </div>
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 1.6rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px auto;">
          <i class="fa-solid fa-check"></i>
        </div>
        <h4 style="font-size: 1.2rem; margin-bottom: 2px;">Payment Confirmed</h4>
        <span style="font-size: 0.8rem; color: var(--text-secondary);">Transaction Ref: <code style="color: var(--accent-cyan); font-weight: 700;">${bill.transactionId || 'TXN_SIMULATED'}</code></span>
      </div>

      <div class="receipt-card">
        <div style="margin-bottom: 12px; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px;">
          <strong style="display: block; font-size: 0.95rem;">${society.name}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${society.address}</span>
        </div>
        <div class="receipt-row">
          <span>Payer Name</span>
          <strong>${user.name}</strong>
        </div>
        <div class="receipt-row">
          <span>Flat Unit</span>
          <strong>${user.flatNo}</strong>
        </div>
        <div class="receipt-row">
          <span>Billing Month</span>
          <strong>${bill.month}</strong>
        </div>
        <div class="receipt-row">
          <span>Payment Date</span>
          <strong>${bill.paidDate || new Date().toISOString().split('T')[0]}</strong>
        </div>
        <div class="receipt-row">
          <span>Payment Status</span>
          <span class="badge badge-paid">PAID</span>
        </div>

        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-color);">
          <strong style="font-size: 0.82rem; text-transform: uppercase; color: var(--text-secondary);">Breakdown</strong>
          ${Object.entries(bill.breakdown || {}).map(([item, amt]) => `
            <div class="receipt-row" style="font-size: 0.8rem; padding: 4px 0;">
              <span>${item}</span>
              <span>₹${amt}</span>
            </div>
          `).join('')}
          <div class="receipt-row total">
            <span>Total Paid</span>
            <span>₹${bill.amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 16px;">
        <button class="action-btn" id="btn-print-receipt" style="flex: 1; justify-content: center;">
          <i class="fa-solid fa-print"></i> Print Invoice
        </button>
        <button class="action-btn action-btn-primary" id="btn-close-receipt" style="flex: 1; justify-content: center;">
          Done
        </button>
      </div>
    `;

    this.openModal(modalContent, () => {
      const btnPrint = document.getElementById('btn-print-receipt');
      if (btnPrint) {
        btnPrint.addEventListener('click', () => {
          window.print();
        });
      }
      const btnDone = document.getElementById('btn-close-receipt');
      if (btnDone) {
        btnDone.addEventListener('click', () => this.closeModal());
      }
    });
  }

  // =========================================================================
  // 5. VISITOR MANAGEMENT VIEW
  // =========================================================================
  renderVisitors() {
    const state = store.getState();
    const statuses = ['All', 'Approved', 'Checked In', 'Checked Out'];
    const role = store.getCurrentRole();
    const isSecurityOrAdmin = role === 'security' || role === 'admin';

    let filtered = state.visitors.filter(v => {
      const matchStatus = this.visitorsFilter === 'All' || v.status === this.visitorsFilter;
      const matchSearch = !this.visitorsSearch ||
        v.visitorName.toLowerCase().includes(this.visitorsSearch.toLowerCase()) ||
        v.passCode.toLowerCase().includes(this.visitorsSearch.toLowerCase()) ||
        v.flatNo.toLowerCase().includes(this.visitorsSearch.toLowerCase()) ||
        v.purpose.toLowerCase().includes(this.visitorsSearch.toLowerCase());
      return matchStatus && matchSearch;
    });

    let html = `
      <div class="filter-bar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="visitors-search-input" placeholder="Search by visitor name, PASS-XXXX, flat number..." value="${this.escapeHtml(this.visitorsSearch)}">
        </div>
        <div class="filter-pills">
          ${statuses.map(s => `
            <div class="pill ${this.visitorsFilter === s ? 'active' : ''}" data-status="${s}">${s}</div>
          `).join('')}
        </div>
        <button class="action-btn action-btn-primary" id="btn-create-visitor">
          <i class="fa-solid fa-plus"></i> Generate Visitor Pass
        </button>
      </div>

      ${filtered.length === 0 ? `
        <div class="empty-state">
          <i class="fa-solid fa-id-badge"></i>
          <h4>No visitor passes recorded</h4>
          <p>Create a pre-approved digital pass for guests, cabs, or deliveries.</p>
        </div>
      ` : `
        <div class="card-grid">
          ${filtered.map(v => `
            <div class="pass-ticket">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <span class="pass-code-pill">${v.passCode}</span>
                  <h4 style="margin-top: 10px; font-size: 1.15rem;">${this.escapeHtml(v.visitorName)}</h4>
                  <span style="font-size: 0.8rem; color: var(--text-secondary);"><i class="fa-solid fa-phone"></i> ${v.phone}</span>
                </div>
                <span class="badge ${this.getBadgeClass(v.status)}">${v.status}</span>
              </div>

              <div style="background: rgba(0,0,0,0.15); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.82rem; display: flex; flex-direction: column; gap: 4px;">
                <div><strong>Purpose:</strong> ${this.escapeHtml(v.purpose)}</div>
                <div><strong>Host Resident:</strong> ${this.escapeHtml(v.hostName)} (Flat ${v.flatNo})</div>
                <div><strong>Expected:</strong> ${v.expectedDate} at ${v.expectedTime}</div>
                ${v.checkInTime ? `<div><strong>In Time:</strong> <span style="color: var(--accent-emerald);">${v.checkInTime}</span></div>` : ''}
                ${v.checkOutTime ? `<div><strong>Out Time:</strong> <span style="color: var(--text-muted);">${v.checkOutTime}</span></div>` : ''}
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px;">
                <div class="pass-qr-sim" title="Simulated Gate QR Code">
                  <svg viewBox="0 0 24 24" fill="#0b0f19">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h-2v2h2v-2zm-4 0h2v2h-2v-2zm2 4h-2v2h2v-2zm2-2h2v4h-2v-4zm-4 2h-2v2h2v-2zm4-4h2v2h-2v-2zm2 0h2v2h-2v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z"/>
                  </svg>
                </div>

                <div style="display: flex; gap: 8px;">
                  ${v.status === 'Approved' ? `
                    <button class="action-btn action-btn-primary btn-checkin" data-id="${v.id}" style="padding: 6px 14px; font-size: 0.82rem;">
                      <i class="fa-solid fa-arrow-right-to-bracket"></i> Check In
                    </button>
                  ` : ''}
                  ${v.status === 'Checked In' ? `
                    <button class="action-btn btn-checkout" data-id="${v.id}" style="padding: 6px 14px; font-size: 0.82rem; border-color: var(--accent-rose); color: var(--accent-rose);">
                      <i class="fa-solid fa-arrow-right-from-bracket"></i> Check Out
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    this.viewContainer.innerHTML = html;

    // Listeners
    const searchInput = document.getElementById('visitors-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.visitorsSearch = e.target.value;
        this.renderVisitors();
      });
    }

    this.viewContainer.querySelectorAll('.filter-pills .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.visitorsFilter = pill.dataset.status;
        this.renderVisitors();
      });
    });

    const btnCreate = document.getElementById('btn-create-visitor');
    if (btnCreate) btnCreate.addEventListener('click', () => this.openCreateVisitorModal());

    this.viewContainer.querySelectorAll('.btn-checkin').forEach(btn => {
      btn.addEventListener('click', () => {
        store.checkInVisitor(btn.dataset.id);
        this.showToast('Visitor marked Checked-In at Gate!', 'success');
      });
    });

    this.viewContainer.querySelectorAll('.btn-checkout').forEach(btn => {
      btn.addEventListener('click', () => {
        store.checkOutVisitor(btn.dataset.id);
        this.showToast('Visitor marked Checked-Out', 'info');
      });
    });
  }

  openCreateVisitorModal() {
    const today = new Date().toISOString().split('T')[0];
    const user = store.getCurrentUser();

    const modalContent = `
      <div class="modal-header">
        <h3><i class="fa-solid fa-id-badge" style="color: var(--accent-primary);"></i> Pre-Approve Visitor Pass</h3>
        <button class="close-btn" id="modal-close">&times;</button>
      </div>
      <form id="form-create-pass">
        <div class="form-group">
          <label for="vis-name">Visitor Name / Organization</label>
          <input type="text" id="vis-name" class="form-control" placeholder="e.g. David Miller or Amazon Delivery" required>
        </div>
        <div class="form-group">
          <label for="vis-phone">Visitor Contact Number</label>
          <input type="tel" id="vis-phone" class="form-control" placeholder="+91 98765 43210" required>
        </div>
        <div class="form-group">
          <label for="vis-purpose">Visit Purpose</label>
          <select id="vis-purpose" class="form-control">
            <option value="Guest / Family">Guest / Family</option>
            <option value="Delivery (Courier / Food)">Delivery (Courier / Food)</option>
            <option value="Maintenance / Home Service">Maintenance / Home Service</option>
            <option value="Cab / Taxi Pickup">Cab / Taxi Pickup</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label for="vis-date">Expected Date</label>
            <input type="date" id="vis-date" class="form-control" value="${today}" min="${today}" required>
          </div>
          <div class="form-group">
            <label for="vis-time">Expected Time</label>
            <input type="time" id="vis-time" class="form-control" value="14:00" required>
          </div>
        </div>
        <div style="background: rgba(0,0,0,0.15); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 0.8rem; color: var(--text-secondary);">
          <i class="fa-solid fa-shield-halved"></i> Pass will be pre-cleared for <strong>Flat ${user.flatNo}</strong>. Security desk will admit directly upon code presentation.
        </div>
        <button type="submit" class="action-btn action-btn-primary" style="width: 100%; justify-content: center;">
          <i class="fa-solid fa-qrcode"></i> Generate Digital Pass
        </button>
      </form>
    `;

    this.openModal(modalContent, () => {
      const form = document.getElementById('form-create-pass');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const visitorName = document.getElementById('vis-name').value.trim();
        const phone = document.getElementById('vis-phone').value.trim();
        const purpose = document.getElementById('vis-purpose').value;
        const expectedDate = document.getElementById('vis-date').value;
        const expectedTime = document.getElementById('vis-time').value;

        const newPass = store.createVisitorPass({
          visitorName, phone, purpose, expectedDate, expectedTime
        });

        this.closeModal();
        this.showToast(`Pass created: ${newPass.passCode}`, 'success');
      });
    });
  }

  // =========================================================================
  // 6. AMENITIES & BOOKINGS VIEW
  // =========================================================================
  renderAmenities() {
    const state = store.getState();
    const amenities = state.amenities;
    const bookings = state.bookings;
    const user = store.getCurrentUser();
    const isAdmin = store.getCurrentRole() === 'admin';

    let html = `
      <div class="section-header">
        <h3><i class="fa-solid fa-swimming-pool" style="color: var(--accent-primary); margin-right: 8px;"></i> Society Club & Sports Facilities</h3>
        <button class="action-btn action-btn-primary" id="btn-book-amenity-header">
          <i class="fa-solid fa-calendar-plus"></i> Reserve Facility
        </button>
      </div>

      <div class="card-grid" style="margin-bottom: 36px;">
        ${amenities.map(a => `
          <div class="amenity-card">
            <div class="amenity-media">
              <img src="${a.image}" alt="${this.escapeHtml(a.name)}" loading="lazy">
              <span class="amenity-price-tag">
                ${a.pricePerHour > 0 ? `₹${a.pricePerHour}/hr` : 'Complimentary'}
              </span>
            </div>
            <div class="amenity-body">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <h4>${this.escapeHtml(a.name)}</h4>
                <span class="badge badge-event">${a.category}</span>
              </div>
              <div class="amenity-meta">
                <span><i class="fa-regular fa-clock"></i> ${a.timing}</span>
                <span><i class="fa-solid fa-users"></i> ${a.capacity}</span>
              </div>
              <button class="action-btn action-btn-primary btn-open-book-modal" data-id="${a.id}" style="margin-top: auto; justify-content: center;">
                <i class="fa-solid fa-calendar-check"></i> Book Now
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-header">
        <h3><i class="fa-regular fa-calendar-days" style="color: var(--accent-cyan); margin-right: 8px;"></i> Current Facility Reservations</h3>
      </div>

      ${bookings.length === 0 ? `
        <div class="empty-state">
          <i class="fa-regular fa-calendar-xmark"></i>
          <h4>No active bookings</h4>
          <p>Be the first to reserve the clubhouse or tennis court this week!</p>
        </div>
      ` : `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Reserved Date</th>
                <th>Time Slot</th>
                <th>Resident / Flat</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.map(b => {
                const canCancel = isAdmin || b.flatNo === user.flatNo;
                return `
                  <tr>
                    <td><strong>${this.escapeHtml(b.amenityName)}</strong></td>
                    <td>${b.date}</td>
                    <td><span class="badge badge-general">${b.slot}</span></td>
                    <td>${this.escapeHtml(b.userName)} (${b.flatNo})</td>
                    <td><span class="badge badge-approved">${b.status}</span></td>
                    <td>
                      ${canCancel ? `
                        <button class="action-btn btn-cancel-booking" data-id="${b.id}" style="padding: 4px 10px; font-size: 0.78rem; color: var(--accent-rose); border-color: rgba(244,63,94,0.3);">
                          <i class="fa-solid fa-ban"></i> Cancel
                        </button>
                      ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    this.viewContainer.innerHTML = html;

    const btnHeaderBook = document.getElementById('btn-book-amenity-header');
    if (btnHeaderBook) btnHeaderBook.addEventListener('click', () => this.openBookAmenityModal());

    this.viewContainer.querySelectorAll('.btn-open-book-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openBookAmenityModal(btn.dataset.id);
      });
    });

    this.viewContainer.querySelectorAll('.btn-cancel-booking').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel this booking?')) {
          store.cancelBooking(btn.dataset.id);
          this.showToast('Reservation cancelled successfully', 'info');
        }
      });
    });
  }

  openBookAmenityModal(defaultAmenityId = null) {
    const state = store.getState();
    const amenities = state.amenities;
    const today = new Date().toISOString().split('T')[0];

    const slots = [
      '06:00 AM - 08:00 AM',
      '08:00 AM - 10:00 AM',
      '10:00 AM - 12:00 PM',
      '04:00 PM - 06:00 PM',
      '06:00 PM - 08:00 PM',
      '08:00 PM - 10:00 PM'
    ];

    const modalContent = `
      <div class="modal-header">
        <h3><i class="fa-solid fa-calendar-check" style="color: var(--accent-primary);"></i> Reserve Society Facility</h3>
        <button class="close-btn" id="modal-close">&times;</button>
      </div>
      <form id="form-book-amenity">
        <div class="form-group">
          <label for="book-amenity-select">Select Facility</label>
          <select id="book-amenity-select" class="form-control">
            ${amenities.map(a => `
              <option value="${a.id}" ${defaultAmenityId === a.id ? 'selected' : ''}>
                ${a.name} (${a.pricePerHour > 0 ? '₹' + a.pricePerHour + '/hr' : 'Free'})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="book-date">Booking Date</label>
          <input type="date" id="book-date" class="form-control" value="${today}" min="${today}" required>
        </div>
        <div class="form-group">
          <label for="book-slot">Select Time Slot</label>
          <select id="book-slot" class="form-control">
            ${slots.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div id="booking-conflict-alert" style="display: none; background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.4); color: #fb7185; padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 14px; font-size: 0.85rem;">
          <i class="fa-solid fa-circle-exclamation"></i> <span id="booking-conflict-text">Slot unavailable</span>
        </div>
        <button type="submit" class="action-btn action-btn-primary" style="width: 100%; justify-content: center;">
          <i class="fa-solid fa-check"></i> Confirm Reservation
        </button>
      </form>
    `;

    this.openModal(modalContent, () => {
      const form = document.getElementById('form-book-amenity');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amenityId = document.getElementById('book-amenity-select').value;
        const date = document.getElementById('book-date').value;
        const slot = document.getElementById('book-slot').value;
        const alertBox = document.getElementById('booking-conflict-alert');
        const alertText = document.getElementById('booking-conflict-text');

        try {
          store.bookAmenity(amenityId, date, slot);
          this.closeModal();
          this.showToast('Facility booked successfully! Slot reserved.', 'success');
        } catch (err) {
          alertText.textContent = err.message || 'Slot conflict. Please pick another slot.';
          alertBox.style.display = 'block';
        }
      });
    });
  }

  // =========================================================================
  // 7. COMMUNITY POLLS & SURVEYS VIEW
  // =========================================================================
  renderPolls() {
    const state = store.getState();
    const polls = state.polls;

    let html = `
      <div class="section-header">
        <h3><i class="fa-solid fa-square-poll-vertical" style="color: var(--accent-primary); margin-right: 8px;"></i> Active Community Decisions & Votes</h3>
        <button class="action-btn action-btn-primary" id="btn-create-poll-header">
          <i class="fa-solid fa-plus"></i> Create New Poll
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 800px;">
        ${polls.map(p => {
          const totalVotes = p.totalVotes || 0;
          return `
            <div class="poll-card">
              <div class="poll-header">
                <div>
                  <span class="badge badge-event" style="margin-bottom: 6px; display: inline-block;">${p.category}</span>
                  <div class="poll-question">${this.escapeHtml(p.question)}</div>
                </div>
                <span class="badge badge-approved">${p.status}</span>
              </div>

              <div class="poll-options">
                ${p.options.map(opt => {
                  const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  const isUserPick = p.userVotedOption === opt.id;
                  return `
                    <div class="poll-option-btn ${isUserPick ? 'selected' : ''}" data-poll="${p.id}" data-opt="${opt.id}">
                      <div class="poll-bar-fill" style="width: ${percentage}%;"></div>
                      <div class="poll-option-content">
                        <span class="poll-option-text">
                          <i class="fa-${isUserPick ? 'solid fa-circle-check' : 'regular fa-circle'}" style="color: ${isUserPick ? 'var(--accent-primary)' : 'var(--text-muted)'}; font-size: 1.1rem;"></i>
                          ${this.escapeHtml(opt.text)}
                        </span>
                        <span class="poll-percentage">${percentage}% <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal;">(${opt.votes})</span></span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="card-footer" style="padding-top: 12px; margin-top: 4px;">
                <span><i class="fa-solid fa-users"></i> ${totalVotes} total resident votes</span>
                <span><i class="fa-regular fa-clock"></i> Closes on ${p.endDate}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.viewContainer.innerHTML = html;

    const btnNewPoll = document.getElementById('btn-create-poll-header');
    if (btnNewPoll) btnNewPoll.addEventListener('click', () => this.openAddPollModal());

    this.viewContainer.querySelectorAll('.poll-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pollId = btn.dataset.poll;
        const optId = btn.dataset.opt;
        store.votePoll(pollId, optId);
        this.showToast('Your vote has been recorded!', 'success');
      });
    });
  }

  openAddPollModal() {
    const modalContent = `
      <div class="modal-header">
        <h3><i class="fa-solid fa-square-poll-vertical" style="color: var(--accent-primary);"></i> Create Community Poll</h3>
        <button class="close-btn" id="modal-close">&times;</button>
      </div>
      <form id="form-add-poll">
        <div class="form-group">
          <label for="poll-question">Poll Question</label>
          <input type="text" id="poll-question" class="form-control" placeholder="e.g. Should we install EV chargers in B Wing basement?" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label for="poll-category">Category</label>
            <select id="poll-category" class="form-control">
              <option value="Infrastructure">Infrastructure</option>
              <option value="Sports & Leisure">Sports & Leisure</option>
              <option value="Security & Rules">Security & Rules</option>
              <option value="Cultural">Cultural</option>
            </select>
          </div>
          <div class="form-group">
            <label for="poll-enddate">End Date</label>
            <input type="date" id="poll-enddate" class="form-control" value="2026-09-30">
          </div>
        </div>
        <div class="form-group">
          <label>Options (one per line, min 2)</label>
          <textarea id="poll-options-text" class="form-control" rows="3" placeholder="Yes, approve\nNo, decline" required>Yes, approve installation\nNo, need more details</textarea>
        </div>
        <button type="submit" class="action-btn action-btn-primary" style="width: 100%; justify-content: center;">
          <i class="fa-solid fa-rocket"></i> Launch Poll
        </button>
      </form>
    `;

    this.openModal(modalContent, () => {
      const form = document.getElementById('form-add-poll');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const question = document.getElementById('poll-question').value.trim();
        const category = document.getElementById('poll-category').value;
        const endDate = document.getElementById('poll-enddate').value;
        const optionsRaw = document.getElementById('poll-options-text').value.trim();
        const options = optionsRaw.split('\n').map(s => s.trim()).filter(Boolean);

        if (options.length < 2) {
          alert('Please specify at least two options.');
          return;
        }

        store.addPoll({ question, category, endDate, options });
        this.closeModal();
        this.showToast('Poll created and published to residents!', 'success');
      });
    });
  }

  // =========================================================================
  // 8. RESIDENT DIRECTORY VIEW
  // =========================================================================
  renderDirectory() {
    const state = store.getState();
    const directory = state.directory;
    const wings = ['All', 'A Wing', 'B Wing', 'C Wing'];

    let filtered = directory.filter(d => {
      const matchWing = this.directoryFilter === 'All' || d.block === this.directoryFilter;
      const matchSearch = !this.directorySearch ||
        d.name.toLowerCase().includes(this.directorySearch.toLowerCase()) ||
        d.flatNo.toLowerCase().includes(this.directorySearch.toLowerCase()) ||
        d.phone.includes(this.directorySearch) ||
        d.email.toLowerCase().includes(this.directorySearch.toLowerCase());
      return matchWing && matchSearch;
    });

    let html = `
      <div class="filter-bar">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="directory-search-input" placeholder="Search residents by name, flat number, wing..." value="${this.escapeHtml(this.directorySearch)}">
        </div>
        <div class="filter-pills">
          ${wings.map(w => `
            <div class="pill ${this.directoryFilter === w ? 'active' : ''}" data-wing="${w}">${w}</div>
          `).join('')}
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Flat / Unit</th>
              <th>Resident Name</th>
              <th>Wing / Block</th>
              <th>Occupancy</th>
              <th>Family Members</th>
              <th>Contact Phone</th>
              <th>Email Address</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(d => `
              <tr>
                <td><strong style="color: var(--accent-cyan);">${d.flatNo}</strong></td>
                <td><strong>${this.escapeHtml(d.name)}</strong></td>
                <td>${d.block}</td>
                <td><span class="badge ${d.occupancy === 'Owner' ? 'badge-approved' : 'badge-general'}">${d.occupancy}</span></td>
                <td><i class="fa-solid fa-people-roof" style="color: var(--text-muted); margin-right: 4px;"></i> ${d.members}</td>
                <td><a href="tel:${d.phone}" style="color: var(--text-primary); text-decoration: none;"><i class="fa-solid fa-phone" style="font-size: 0.75rem; color: var(--accent-emerald); margin-right: 4px;"></i> ${d.phone}</a></td>
                <td><a href="mailto:${d.email}" style="color: var(--text-secondary); text-decoration: none;"><i class="fa-regular fa-envelope" style="font-size: 0.75rem; margin-right: 4px;"></i> ${d.email}</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.viewContainer.innerHTML = html;

    const searchInput = document.getElementById('directory-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.directorySearch = e.target.value;
        this.renderDirectory();
      });
    }

    this.viewContainer.querySelectorAll('.filter-pills .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.directoryFilter = pill.dataset.wing;
        this.renderDirectory();
      });
    });
  }

  // =========================================================================
  // 9. EMERGENCY CONTACTS VIEW
  // =========================================================================
  renderEmergency() {
    const state = store.getState();
    const contacts = state.emergencyContacts;
    const internal = contacts.filter(c => c.type === 'Internal');
    const external = contacts.filter(c => c.type === 'External');

    let html = `
      <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: var(--radius-lg); padding: 18px 24px; margin-bottom: 28px; display: flex; align-items: center; gap: 16px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: var(--accent-rose);"></i>
        <div>
          <h4 style="color: #fb7185; margin-bottom: 2px;">24x7 Emergency Helplines</h4>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Direct hotlines for immediate security, on-duty manager, fire, ambulance, and police dispatch.</p>
        </div>
      </div>

      <div class="section-header">
        <h3><i class="fa-solid fa-shield-check" style="color: var(--accent-primary); margin-right: 8px;"></i> Society In-House Emergency Desks</h3>
      </div>
      <div class="card-grid" style="margin-bottom: 32px;">
        ${internal.map(c => `
          <div class="contact-card">
            <div class="contact-icon">
              <i class="fa-solid fa-${c.icon || 'phone'}"></i>
            </div>
            <div class="contact-info">
              <h4>${this.escapeHtml(c.service)}</h4>
              <p>${this.escapeHtml(c.contactPerson)}</p>
              <strong style="color: var(--accent-cyan); display: block; margin-top: 4px;">${c.phone}</strong>
            </div>
            <a href="tel:${c.phone}" class="call-btn" data-service="${this.escapeHtml(c.service)}" data-phone="${c.phone}">
              <i class="fa-solid fa-phone"></i> Call
            </a>
          </div>
        `).join('')}
      </div>

      <div class="section-header">
        <h3><i class="fa-solid fa-truck-medical" style="color: var(--accent-rose); margin-right: 8px;"></i> City Emergency Services (Sector 4)</h3>
      </div>
      <div class="card-grid">
        ${external.map(c => `
          <div class="contact-card">
            <div class="contact-icon" style="background: rgba(244, 63, 94, 0.15); color: var(--accent-rose);">
              <i class="fa-solid fa-${c.icon || 'hospital'}"></i>
            </div>
            <div class="contact-info">
              <h4>${this.escapeHtml(c.service)}</h4>
              <p>${this.escapeHtml(c.contactPerson)}</p>
              <strong style="color: var(--accent-cyan); display: block; margin-top: 4px;">${c.phone}</strong>
            </div>
            <a href="tel:${c.phone}" class="call-btn" data-service="${this.escapeHtml(c.service)}" data-phone="${c.phone}">
              <i class="fa-solid fa-phone"></i> Call
            </a>
          </div>
        `).join('')}
      </div>
    `;

    this.viewContainer.innerHTML = html;

    this.viewContainer.querySelectorAll('.call-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const service = btn.dataset.service;
        const phone = btn.dataset.phone;
        this.triggerEmergencyCall(service, phone);
      });
    });
  }

  triggerEmergencyCall(service, phone) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
    }
    this.showToast(`Dialing ${service}: ${phone} (Copied to clipboard)`, 'success');
  }

  // =========================================================================
  // 10. SYSTEM BACKUP & SETTINGS VIEW
  // =========================================================================
  renderBackup() {
    const state = store.getState();
    let html = `
      <div class="section-header">
        <h3><i class="fa-solid fa-sliders" style="color: var(--accent-primary); margin-right: 8px;"></i> System Data & Backup Controls</h3>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 28px;">
        <!-- Export Box -->
        <div class="content-card">
          <div class="card-header">
            <h4><i class="fa-solid fa-download" style="color: var(--accent-emerald);"></i> Export Local Data</h4>
          </div>
          <p class="card-body">
            Download a full JSON snapshot of all notices, tickets, visitor logs, facility reservations, and resident details to your computer.
          </p>
          <button class="action-btn action-btn-primary" id="btn-export-backup" style="justify-content: center;">
            <i class="fa-solid fa-file-export"></i> Download JSON Backup
          </button>
        </div>

        <!-- Import Box -->
        <div class="content-card">
          <div class="card-header">
            <h4><i class="fa-solid fa-upload" style="color: var(--accent-primary);"></i> Restore From File</h4>
          </div>
          <p class="card-body">
            Upload and restore a previously saved JSON backup file. All society datasets will be synchronized immediately.
          </p>
          <input type="file" id="file-import-input" accept=".json" style="display: none;">
          <button class="action-btn" id="btn-trigger-import" style="justify-content: center;">
            <i class="fa-solid fa-file-import"></i> Upload JSON File
          </button>
        </div>

        <!-- Reset Box -->
        <div class="content-card">
          <div class="card-header">
            <h4><i class="fa-solid fa-arrow-rotate-left" style="color: var(--accent-rose);"></i> Factory Reset</h4>
          </div>
          <p class="card-body">
            Wipe out current localStorage modifications and restore the clean initial sample dataset for testing and demonstrations.
          </p>
          <button class="action-btn" id="btn-factory-reset" style="justify-content: center; border-color: var(--accent-rose); color: var(--accent-rose);">
            <i class="fa-solid fa-trash-arrow-up"></i> Reset Sample Data
          </button>
        </div>
      </div>

      <!-- App System Status -->
      <div class="table-container" style="padding: 24px;">
        <h4 style="margin-bottom: 14px;"><i class="fa-solid fa-server" style="color: var(--accent-cyan);"></i> Active System Telemetry</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 0.9rem;">
          <div><span style="color: var(--text-muted);">Storage Engine:</span> <strong>HTML5 LocalStorage</strong></div>
          <div><span style="color: var(--text-muted);">Storage Key:</span> <code>${store.storageKey}</code></div>
          <div><span style="color: var(--text-muted);">Total Complaints:</span> <strong>${state.complaints.length} records</strong></div>
          <div><span style="color: var(--text-muted);">Total Visitors:</span> <strong>${state.visitors.length} passes</strong></div>
          <div><span style="color: var(--text-muted);">Total Polls:</span> <strong>${state.polls.length} active</strong></div>
          <div><span style="color: var(--text-muted);">Current Theme:</span> <strong>${this.theme.toUpperCase()}</strong></div>
        </div>
      </div>
    `;

    this.viewContainer.innerHTML = html;

    const btnExport = document.getElementById('btn-export-backup');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        store.exportJSON();
        this.showToast('Backup JSON generated and downloaded', 'success');
      });
    }

    const fileInput = document.getElementById('file-import-input');
    const btnTrigger = document.getElementById('btn-trigger-import');
    if (btnTrigger && fileInput) {
      btnTrigger.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = store.importJSON(event.target.result);
          if (success) {
            this.showToast('JSON data imported successfully!', 'success');
          } else {
            this.showToast('Failed to import JSON. Invalid format.', 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    const btnReset = document.getElementById('btn-factory-reset');
    if (btnReset) {
      btnReset.addEventListener('click', async () => {
        if (confirm('Clear local changes and reset sample dataset?')) {
          await store.resetToDefault();
          this.showToast('Demo dataset reset to initial state', 'success');
        }
      });
    }
  }

  // =========================================================================
  // MODAL & TOAST HELPERS
  // =========================================================================
  openModal(contentHtml, onMounted = null) {
    if (!this.modalBox || !this.modalOverlay) return;
    this.modalBox.innerHTML = contentHtml;
    this.modalOverlay.classList.add('active');
    this.modalOverlay.setAttribute('aria-hidden', 'false');

    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (typeof onMounted === 'function') {
      onMounted();
    }
  }

  closeModal() {
    if (!this.modalOverlay) return;
    this.modalOverlay.classList.remove('active');
    this.modalOverlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      if (this.modalBox) this.modalBox.innerHTML = '';
    }, 250);
  }

  showToast(message, type = 'info') {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    let borderColor = 'var(--accent-primary)';
    if (type === 'success') {
      icon = 'fa-circle-check';
      borderColor = 'var(--accent-emerald)';
    } else if (type === 'error') {
      icon = 'fa-circle-exclamation';
      borderColor = 'var(--accent-rose)';
    } else if (type === 'warning') {
      icon = 'fa-triangle-exclamation';
      borderColor = 'var(--accent-amber)';
    }

    toast.style.borderLeftColor = borderColor;
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${borderColor}; font-size: 1.1rem;"></i> <span>${this.escapeHtml(message)}</span>`;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  getBadgeClass(val) {
    if (!val) return 'badge-general';
    const s = val.toLowerCase().replace(/\s+/g, '-');
    return `badge-${s}`;
  }

  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Instantiate and start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new HorizonApp();
  app.start();
  window.horizonApp = app;
});
