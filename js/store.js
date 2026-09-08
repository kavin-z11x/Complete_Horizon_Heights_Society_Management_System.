/**
 * Horizon Heights - Central JSON Repository & Reactive Store
 * Manages JSON load/save, localStorage synchronization, role state, and CRUD operations.
 */
export class SocietyStore {
  constructor() {
    this.storageKey = 'horizon_society_app_data_v1';
    this.state = null;
    this.listeners = [];
  }

  async init() {
    const savedData = localStorage.getItem(this.storageKey);
    if (savedData) {
      try {
        this.state = JSON.parse(savedData);
      } catch (err) {
        console.error('Failed to parse localStorage JSON, fetching default dataset:', err);
        await this.loadDefaultData();
      }
    } else {
      await this.loadDefaultData();
    }
    return this.state;
  }

  async loadDefaultData() {
    const response = await fetch('./data/society_data.json');
    this.state = await response.json();
    this.saveState();
  }

  saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    this.notify();
  }

  resetToDefault() {
    localStorage.removeItem(this.storageKey);
    return this.init();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // --- Getters ---
  getState() {
    return this.state;
  }

  getCurrentRole() {
    return this.state.currentRole || 'resident';
  }

  getCurrentUser() {
    return this.state.currentUser;
  }

  // --- Role Switcher ---
  setRole(role) {
    this.state.currentRole = role;
    if (role === 'admin') {
      this.state.currentUser = {
        id: 'admin_01',
        name: 'Society Admin (Manager)',
        flatNo: 'Admin Office',
        phone: '+91 80000 22222',
        email: 'admin@horizon.org',
        role: 'Admin'
      };
    } else if (role === 'security') {
      this.state.currentUser = {
        id: 'sec_01',
        name: 'Gate Desk Officer',
        flatNo: 'Security Post 1',
        phone: '+91 80000 11111',
        email: 'security@horizon.org',
        role: 'Security Guard'
      };
    } else {
      this.state.currentUser = {
        id: 'res_101',
        name: 'John Doe',
        flatNo: 'A-402',
        phone: '+91 98765 43210',
        email: 'john.doe@horizon.org',
        role: 'Resident'
      };
    }
    this.saveState();
  }

  // --- Notices ---
  addNotice(noticeData) {
    const newNotice = {
      id: 'not_' + Date.now(),
      title: noticeData.title,
      category: noticeData.category || 'General',
      priority: noticeData.priority || 'Normal',
      date: new Date().toISOString().split('T')[0],
      content: noticeData.content,
      author: this.state.currentUser.name,
      pinned: !!noticeData.pinned
    };
    this.state.notices.unshift(newNotice);
    this.saveState();
    return newNotice;
  }

  deleteNotice(id) {
    this.state.notices = this.state.notices.filter(n => n.id !== id);
    this.saveState();
  }

  // --- Complaints ---
  addComplaint(complaintData) {
    const newComplaint = {
      id: 'cmp_' + Date.now(),
      title: complaintData.title,
      category: complaintData.category,
      flatNo: this.state.currentUser.flatNo,
      postedBy: this.state.currentUser.name,
      date: new Date().toISOString().split('T')[0],
      priority: complaintData.priority || 'Medium',
      status: 'Pending',
      description: complaintData.description
    };
    this.state.complaints.unshift(newComplaint);
    this.saveState();
    return newComplaint;
  }

  updateComplaintStatus(id, newStatus) {
    const cmp = this.state.complaints.find(c => c.id === id);
    if (cmp) {
      cmp.status = newStatus;
      this.saveState();
    }
  }

  // --- Maintenance Payments ---
  payMaintenance(billId) {
    const bill = this.state.maintenance.find(m => m.id === billId);
    if (bill && bill.status === 'Pending') {
      bill.status = 'Paid';
      bill.paidDate = new Date().toISOString().split('T')[0];
      bill.transactionId = 'TXN_' + Math.floor(1000000000 + Math.random() * 9000000000);
      this.saveState();
      return bill;
    }
    return null;
  }

  // --- Visitor Management ---
  createVisitorPass(visitorData) {
    const randomPass = 'PASS-' + Math.floor(1000 + Math.random() * 9000);
    const newVisitor = {
      id: 'vis_' + Date.now(),
      visitorName: visitorData.visitorName,
      phone: visitorData.phone,
      flatNo: this.state.currentUser.flatNo,
      hostName: this.state.currentUser.name,
      purpose: visitorData.purpose,
      expectedDate: visitorData.expectedDate || new Date().toISOString().split('T')[0],
      expectedTime: visitorData.expectedTime || '12:00',
      passCode: randomPass,
      status: 'Approved',
      checkInTime: null,
      checkOutTime: null
    };
    this.state.visitors.unshift(newVisitor);
    this.saveState();
    return newVisitor;
  }

  checkInVisitor(id) {
    const vis = this.state.visitors.find(v => v.id === id);
    if (vis) {
      vis.status = 'Checked In';
      vis.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      this.saveState();
    }
  }

  checkOutVisitor(id) {
    const vis = this.state.visitors.find(v => v.id === id);
    if (vis) {
      vis.status = 'Checked Out';
      vis.checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      this.saveState();
    }
  }

  // --- Amenity Booking ---
  bookAmenity(amenityId, date, slot) {
    const amenity = this.state.amenities.find(a => a.id === amenityId);
    if (!amenity) return null;

    // Check for conflict
    const conflict = this.state.bookings.find(b => b.amenityId === amenityId && b.date === date && b.slot === slot);
    if (conflict) {
      throw new Error('This time slot is already booked! Please select another date or time slot.');
    }

    const newBooking = {
      id: 'bok_' + Date.now(),
      amenityId: amenity.id,
      amenityName: amenity.name,
      flatNo: this.state.currentUser.flatNo,
      userName: this.state.currentUser.name,
      date: date,
      slot: slot,
      status: 'Confirmed'
    };
    this.state.bookings.unshift(newBooking);
    this.saveState();
    return newBooking;
  }

  cancelBooking(id) {
    this.state.bookings = this.state.bookings.filter(b => b.id !== id);
    this.saveState();
  }

  // --- Poll Voting ---
  votePoll(pollId, optionId) {
    const poll = this.state.polls.find(p => p.id === pollId);
    if (!poll) return;

    if (poll.userVotedOption) {
      const prevOpt = poll.options.find(o => o.id === poll.userVotedOption);
      if (prevOpt) prevOpt.votes = Math.max(0, prevOpt.votes - 1);
    } else {
      poll.totalVotes += 1;
    }

    const targetOpt = poll.options.find(o => o.id === optionId);
    if (targetOpt) {
      targetOpt.votes += 1;
    }
    poll.userVotedOption = optionId;
    this.saveState();
  }

  addPoll(pollData) {
    const newPoll = {
      id: 'pol_' + Date.now(),
      question: pollData.question,
      category: pollData.category || 'General',
      endDate: pollData.endDate || '2026-09-30',
      status: 'Active',
      totalVotes: 0,
      options: pollData.options.map((optText, index) => ({
        id: 'opt_' + (index + 1),
        text: optText,
        votes: 0
      })),
      userVotedOption: null
    };
    this.state.polls.unshift(newPoll);
    this.saveState();
    return newPoll;
  }

  // --- Export & Import ---
  exportJSON() {
    const jsonStr = JSON.stringify(this.state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horizon_society_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.society && parsed.notices) {
        this.state = parsed;
        this.saveState();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Invalid JSON file format:', e);
      return false;
    }
  }
}

export const store = new SocietyStore();
