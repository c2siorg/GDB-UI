import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:10000";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

let activeSessionId = null;
let sessionExpiryCallback = null;

export const setSessionIdForApi = (sessionId) => {
    activeSessionId = sessionId;
};

export const onSessionExpired = (callback) => {
    sessionExpiryCallback = callback;
};

// Request interceptor to automatically add session_id to POST request bodies
api.interceptors.request.use((config) => {
    if (config.method === "post" && activeSessionId) {
        if (!config.data) {
            config.data = {};
        }
        if (typeof config.data === "object" && !config.data.session_id) {
            config.data = { ...config.data, session_id: activeSessionId };
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to intercept 404 and trigger session expiry
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 404) {
            if (sessionExpiryCallback) {
                sessionExpiryCallback(error);
            }
        }
        return Promise.reject(error);
    }
);

export const makeRequest = async (endpoint, data = {}, sessionId) => {
    const payload = sessionId ? { ...data, session_id: sessionId } : data;
    return api.post(endpoint, payload);
};

export default api;
