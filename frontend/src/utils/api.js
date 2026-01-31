import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Issues
export const createIssue = async (issueData) => {
  const response = await axios.post(`${API_URL}/issues/`, issueData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getIssues = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/issues/?${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getIssue = async (id) => {
  const response = await axios.get(`${API_URL}/issues/${id}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateIssueStatus = async (id, updateData) => {
  const response = await axios.patch(`${API_URL}/issues/${id}/status`, updateData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const addComment = async (issueId, commentData) => {
  const response = await axios.post(`${API_URL}/issues/${issueId}/comments`, commentData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const uploadIssueMedia = async (issueId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/issues/${issueId}/upload`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const upvoteIssue = async (issueId) => {
  const response = await axios.post(`${API_URL}/issues/${issueId}/upvote`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const mergeIssues = async (mainIssueId, duplicateIssueId) => {
  const response = await axios.post(`${API_URL}/issues/${mainIssueId}/merge/${duplicateIssueId}`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const searchIssues = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/issues/search?${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Announcements
export const getAnnouncements = async () => {
  const response = await axios.get(`${API_URL}/announcements/`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createAnnouncement = async (announcementData) => {
  const response = await axios.post(`${API_URL}/announcements/`, announcementData, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Notifications
export const getNotifications = async (unreadOnly = false) => {
  const response = await axios.get(`${API_URL}/notifications/?unread_only=${unreadOnly}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

// AI Chat
export const chatWithAI = async (message, sessionId) => {
  const response = await axios.post(`${API_URL}/ai/chat`, {
    message,
    session_id: sessionId
  }, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Lost & Found
export const createLostFoundItem = async (itemData) => {
  const response = await axios.post(`${API_URL}/lost-found/`, itemData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getLostFoundItems = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/lost-found/?${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const claimLostFoundItem = async (itemId, claimData) => {
  const response = await axios.post(`${API_URL}/lost-found/${itemId}/claim`, claimData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const verifyLostFoundClaim = async (itemId, verificationData) => {
  const response = await axios.patch(`${API_URL}/lost-found/${itemId}/verify`, verificationData, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Analytics
export const getDashboardAnalytics = async () => {
  const response = await axios.get(`${API_URL}/analytics/dashboard`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Marketplace
export const createMarketplaceListing = async (listingData) => {
  const response = await axios.post(`${API_URL}/marketplace/`, listingData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getMarketplaceListings = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/marketplace/?${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateListingStatus = async (id, status) => {
  const response = await axios.put(`${API_URL}/marketplace/${id}/status?status=${status}`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Mess
export const getMessMenu = async (day) => {
  const params = day ? `?day=${day}` : '';
  const response = await axios.get(`${API_URL}/mess/menu${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const voteMessMenu = async (menuId, voteType) => {
  const response = await axios.post(`${API_URL}/mess/menu/${menuId}/vote`, {
    vote_type: voteType
  }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getPolls = async (activeOnly = true) => {
  const response = await axios.get(`${API_URL}/mess/polls?active_only=${activeOnly}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createPoll = async (pollData) => {
  const response = await axios.post(`${API_URL}/mess/polls`, pollData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const votePoll = async (pollId, optionId) => {
  const response = await axios.post(`${API_URL}/mess/polls/${pollId}/vote`, {
    option_id: optionId
  }, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Rooms
export const getRoomOccupancy = async (hostel) => {
  const params = hostel ? `?hostel=${hostel}` : '';
  const response = await axios.get(`${API_URL}/rooms/occupancy${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Laundry
export const getLaundryMachines = async (block) => {
  const params = block ? `?block=${block}` : '';
  const response = await axios.get(`${API_URL}/laundry/machines${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const bookLaundryMachine = async (machineId, durationMinutes) => {
  const response = await axios.post(`${API_URL}/laundry/machines/${machineId}/use`, {
    duration_minutes: durationMinutes
  }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const releaseLaundryMachine = async (machineId) => {
  const response = await axios.post(`${API_URL}/laundry/machines/${machineId}/release`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Students & Attendance
export const getStudents = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/users/students?${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAttendance = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/attendance/?${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const markAttendance = async (attendanceData) => {
  const response = await axios.post(`${API_URL}/attendance/`, attendanceData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAttendanceStats = async (studentId) => {
  const response = await axios.get(`${API_URL}/attendance/stats/${studentId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Gate Pass
export const applyGatePass = async (passData) => {
  const response = await axios.post(`${API_URL}/gatepass/`, passData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getGatePasses = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`${API_URL}/gatepass/?${params}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateGatePassStatus = async (passId, statusData) => {
  const response = await axios.patch(`${API_URL}/gatepass/${passId}/status`, statusData, {
    headers: getAuthHeader()
  });
  return response.data;
};
