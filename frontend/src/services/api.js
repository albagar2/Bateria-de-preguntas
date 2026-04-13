// ============================================
// API Service — centralized HTTP client
// ============================================
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

class ApiService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    else localStorage.removeItem('refreshToken');
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async request(method, endpoint, body = null, retry = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config = { method, headers };
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // Handle token expiration
    if (response.status === 401 && retry && this.refreshToken) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request(method, endpoint, body, false);
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'Error del servidor');
      error.status = response.status;
      error.errors = data.errors;
      throw error;
    }

    return data;
  }

  async tryRefreshToken() {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        window.location.href = '/login';
        return false;
      }

      const data = await response.json();
      this.setTokens(data.data.accessToken, this.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // ─── Auth ────────────────────────────
  register(data) { return this.request('POST', '/auth/register', data); }
  login(data) { return this.request('POST', '/auth/login', data); }
  logout() { return this.request('POST', '/auth/logout', { refreshToken: this.refreshToken }); }

  // ─── Oppositions ───────────────────────
  getOppositions() { return this.request('GET', '/oppositions'); }
  createOpposition(data) { return this.request('POST', '/oppositions', data); }

  // ─── User ────────────────────────────
  getProfile() { return this.request('GET', '/users/profile'); }
  updateProfile(data) { return this.request('PATCH', '/users/profile', data); }
  changePassword(data) { return this.request('POST', '/users/change-password', data); }
  deleteAccount(password) { return this.request('DELETE', '/users/account', { password }); }

  // ─── Topics ──────────────────────────
  getTopics(params = {}) { 
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/topics${qs ? `?${qs}` : ''}`); 
  }
  getTopic(id) { return this.request('GET', `/topics/${id}`); }
  createTopic(data) { return this.request('POST', '/topics', data); }
  updateAdminTopic(id, data) { return this.request('PUT', `/topics/${id}`, data); }
  deleteAdminTopic(id) { return this.request('DELETE', `/topics/${id}`); }
  
  // ─── Subtopics ───────────────────────
  getSubtopics(topicId) { return this.request('GET', `/topics/${topicId}/subtopics`); }
  createSubtopic(data) { return this.request('POST', '/subtopics', data); }
  updateSubtopic(id, data) { return this.request('PUT', `/subtopics/${id}`, data); }
  deleteSubtopic(id) { return this.request('DELETE', `/subtopics/${id}`); }

  createQuestion(data) { return this.request('POST', '/questions', data); }
  bulkCreateQuestions(data) { return this.request('POST', '/questions/bulk', data); }

  // ─── Questions ───────────────────────
  getQuestions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/questions${qs ? `?${qs}` : ''}`);
  }
  getNoFailMode(topicId, difficulty) {
    const qs = difficulty ? `?difficulty=${difficulty}` : '';
    return this.request('GET', `/questions/no-fail/${topicId}${qs}`);
  }
  getReviewQuestions(limit = 20) { return this.request('GET', `/questions/review?limit=${limit}`); }
  answerQuestion(data) { return this.request('POST', '/questions/answer', data); }

  // ─── Tests ───────────────────────────
  createTest(data) { return this.request('POST', '/tests', data); }
  submitTestAnswer(testId, data) { return this.request('POST', `/tests/${testId}/answer`, data); }
  completeTest(testId) { return this.request('POST', `/tests/${testId}/complete`); }
  getTestHistory(page = 1) { return this.request('GET', `/tests/history?page=${page}`); }
  getTestResult(testId) { return this.request('GET', `/tests/${testId}`); }

  // ─── Stats ───────────────────────────
  getStats() { return this.request('GET', '/stats'); }
  getMistakes(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/stats/mistakes${qs ? `?${qs}` : ''}`);
  }
  getMostFailed() { return this.request('GET', '/stats/most-failed'); }
  getBookmarks() { return this.request('GET', '/stats/bookmarks'); }
  toggleBookmark(data) { return this.request('POST', '/stats/bookmarks', data); }
  getAchievements() { return this.request('GET', '/stats/achievements'); }
  checkAchievements() { return this.request('POST', '/stats/achievements/check'); }

  // ─── Study Plans ─────────────────────
  generatePlan(data) { return this.request('POST', '/study-plans/generate', data); }
  getPlans(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/study-plans${qs ? `?${qs}` : ''}`);
  }
  getTodayPlan() { return this.request('GET', '/study-plans/today'); }
  getPlanAIAdvice() { return this.request('GET', '/study-plans/ai-advice'); }
  completePlan(id) { return this.request('PATCH', `/study-plans/${id}/complete`); }

  // ─── AI Integration ──────────────────────
  askAIExplanation(data) { return this.request('POST', '/ai/explain', data); }
  askAIChat(question, topic = 'General') { return this.request('POST', '/ai/ask', { question, topic }); }

  // ─── Admin Integration ───────────────────
  getAdminStats() { return this.request('GET', '/admin/stats'); }
  getAdminUsers() { return this.request('GET', '/admin/users'); }
  deleteAdminUser(id) { return this.request('DELETE', `/admin/users/${id}`); }
  updateAdminUserRole(id, role) { return this.request('PATCH', `/admin/users/${id}/role`, { role }); }
  createAdminTopic(data) { return this.request('POST', '/admin/topics', data); }
  updateAdminTopic(id, data) { return this.request('PATCH', `/admin/topics/${id}`, data); }
  deleteAdminTopic(id) { return this.request('DELETE', `/admin/topics/${id}`); }
  getAdminQuestions() { return this.request('GET', '/admin/questions'); }
  createAdminQuestion(data) { return this.request('POST', '/admin/questions', data); }
  updateAdminQuestion(id, data) { return this.request('PATCH', `/admin/questions/${id}`, data); }
  deleteAdminQuestion(id) { return this.request('DELETE', `/admin/questions/${id}`); }
}

export const api = new ApiService();
export default api;
