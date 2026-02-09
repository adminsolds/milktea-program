const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

(async () => {
  const report = {
    health: null,
    login: { success: false, token: null },
    profile: null
  };

  // Health check
  try {
    const res = await axios.get(`${API_BASE}/health`);
    report.health = { ok: true, data: res.data };
  } catch (err) {
    report.health = { ok: false, error: err.message };
  }

  // Try login
  const payloads = [
    { openid: 'e2e-test', phone: '13900000001', nickname: 'End2End', avatar: '' },
    { openid: 'e2e-test2' }
  ];
  for (const p of payloads) {
    try {
      const r = await axios.post(`${API_BASE}/users/login`, p);
      const data = r.data || {};
      report.login = {
        success: true,
        token: data.token || data.accessToken || null
      };
      break;
    } catch (e) {
      report.login = { success: false, token: null };
    }
  }

  // If we got a token, try to fetch profile
  if (report.login?.token) {
    try {
      const res = await axios.get(`${API_BASE}/users/profile`, {
        headers: { Authorization: `Bearer ${report.login.token}` }
      });
      report.profile = { ok: true, data: res.data };
    } catch (e) {
      report.profile = { ok: false, error: e.message };
    }
  } else {
    report.profile = { ok: false, error: 'no token' };
  }

  console.log(JSON.stringify({ ok: true, timestamp: new Date().toISOString(), report }, null, 2));
})().catch(err => {
  console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
});
