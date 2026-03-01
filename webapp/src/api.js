import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

export const makeRequest = async (endpoint, data = {}, sessionId) => {
    if (!sessionId) {
        console.warn(`[api] No sessionId provided for ${endpoint}`);
    }
    const payload = sessionId ? { ...data, session_id: sessionId } : data;
    return api.post(endpoint, payload);
};

export default api;
