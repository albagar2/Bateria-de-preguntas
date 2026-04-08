// ============================================
// API Service — centralized HTTP client
// ============================================
const API_BASE = '/api/v1';

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

  // ─── User ────────────────────────────
  getProfile() { return this.request('GET', '/users/profile'); }
  updateProfile(data) { return this.request('PATCH', '/users/profile', data); }
  changePassword(data) { return this.request('POST', '/users/change-password', data); }
  deleteAccount(password) { return this.request('DELETE', '/users/account', { password }); }

  // ─── Topics ──────────────────────────
  getTopics() { return this.request('GET', '/topics'); }
  getTopic(id) { return this.request('GET', `/topics/${id}`); }

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
  completePlan(id) { return this.request('PATCH', `/study-plans/${id}/complete`); }
}

export const api = new ApiService();
export default api;
