import axios from 'axios';

const sessionId = (() => {
  let id = sessionStorage.getItem('gdbui-session-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('gdbui-session-id', id);
  }
  return id;
})();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:10000',
  headers: { 'X-Session-ID': sessionId },
});

export default api;
