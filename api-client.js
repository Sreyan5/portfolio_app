/**
 * ═══════════════════════════════════════════════════════════════
 *  PORTFOLIO API CLIENT
 *  Connects the frontend to the Express backend
 *  Include this via <script src="api-client.js"></script>
 * ═══════════════════════════════════════════════════════════════
 */

const PortfolioAPI = (function () {
  'use strict';

  const BASE = ''; // Same origin when served by Express
  let adminToken = null;

  // ──── Token Management ────
  function setToken(token) {
    adminToken = token;
    sessionStorage.setItem('sm_admin_token', token);
  }

  function getToken() {
    if (!adminToken) adminToken = sessionStorage.getItem('sm_admin_token');
    return adminToken;
  }

  function clearToken() {
    adminToken = null;
    sessionStorage.removeItem('sm_admin_token');
  }

  function authHeaders() {
    const t = getToken();
    return t ? { 'x-admin-token': t } : {};
  }

  // ──── HTTP Helpers ────
  async function get(url) {
    const res = await fetch(BASE + url, { headers: authHeaders() });
    if (!res.ok) throw new Error(`GET ${url}: ${res.status}`);
    return res.json();
  }

  async function post(url, body) {
    const res = await fetch(BASE + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `POST ${url}: ${res.status}`);
    }
    return res.json();
  }

  async function put(url, body) {
    const res = await fetch(BASE + url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`PUT ${url}: ${res.status}`);
    return res.json();
  }

  async function del(url) {
    const res = await fetch(BASE + url, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error(`DELETE ${url}: ${res.status}`);
    return res.json();
  }

  async function patch(url, body) {
    const res = await fetch(BASE + url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw new Error(`PATCH ${url}: ${res.status}`);
    return res.json();
  }

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC API (No auth needed)
  // ═══════════════════════════════════════════════════════════

  async function getPortfolio() {
    return get('/api/portfolio');
  }

  async function getCertificates() {
    return get('/api/certificates');
  }

  async function sendContactMessage(name, email, subject, message) {
    return post('/api/contact', { name, email, subject, message });
  }

  async function trackVisit() {
    try { await post('/api/analytics/visit', {}); } catch (e) { /* silent */ }
  }

  // ═══════════════════════════════════════════════════════════
  //  ADMIN API (Auth required)
  // ═══════════════════════════════════════════════════════════

  async function login(username, password) {
    const result = await post('/api/admin/login', { username, password });
    if (result.token) setToken(result.token);
    return result;
  }

  function logout() {
    clearToken();
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function getMessages() {
    return get('/api/admin/messages');
  }

  async function deleteMessage(id) {
    return del(`/api/admin/messages/${id}`);
  }

  async function markMessageRead(id) {
    return patch(`/api/admin/messages/${id}/read`);
  }

  async function updatePortfolio(updates) {
    return put('/api/admin/portfolio', updates);
  }

  async function addCertificate(cert) {
    return post('/api/admin/certificates', cert);
  }

  async function deleteCertificate(id) {
    return del(`/api/admin/certificates/${id}`);
  }

  async function getAnalytics() {
    return get('/api/admin/analytics');
  }

  async function uploadImage(filename, base64Data) {
    return post('/api/admin/upload', { filename, data: base64Data });
  }

  async function exportBackup() {
    window.open('/api/admin/export?token=' + encodeURIComponent(getToken() || ''));
  }

  // ═══════════════════════════════════════════════════════════
  //  Return public interface
  // ═══════════════════════════════════════════════════════════
  return {
    // Public
    getPortfolio,
    getCertificates,
    sendContactMessage,
    trackVisit,

    // Admin auth
    login,
    logout,
    isLoggedIn,

    // Admin data
    getMessages,
    deleteMessage,
    markMessageRead,
    updatePortfolio,
    addCertificate,
    deleteCertificate,
    getAnalytics,
    uploadImage,
    exportBackup,

    // Token utilities
    getToken,
    setToken,
    clearToken
  };
})();

// Auto-track visit on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => PortfolioAPI.trackVisit());
}
