import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { setSessionIdForApi } from "../api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:10000";

export const useSession = () => {
  const [sessionId, setSessionId] = useState(null);
  const [wsToken, setWsToken] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const isMounted = useRef(false);
  const sessionIdRef = useRef(null);

  const createSession = useCallback(async () => {
    try {
      if (!isMounted.current) return;
      setSessionLoading(true);
      setSessionError(null);
      const response = await axios.post(`${API_BASE}/create_session`);
      const sid = response.data.session_id;
      const token = response.data.ws_token;
      if (!isMounted.current) return;
      setSessionId(sid);
      setWsToken(token);
      sessionIdRef.current = sid;
      setSessionIdForApi(sid);
    } catch (error) {
      if (!isMounted.current) return;
      const status = error.response?.status;
      let message = "Failed to create session";
      if (status === 503) {
        message = "Server capacity reached (MAX_SESSIONS - HTTP 503). Please try again later.";
      } else if (status === 429) {
        message = "Rate limited. Please wait before creating a new session.";
      } else if (error.message) {
        message = error.message;
      }
      setSessionError(message);
      setSessionId(null);
      setWsToken(null);
      sessionIdRef.current = null;
      setSessionIdForApi(null);
    } finally {
      if (isMounted.current) {
        setSessionLoading(false);
      }
    }
  }, []);

  const endSession = useCallback(async (sid) => {
    if (!sid) return;
    const isCurrentSession = sessionIdRef.current === sid;
    try {
      await axios.post(`${API_BASE}/end_session`, { session_id: sid });
    } catch (error) {
      // Session may have already expired -- that is fine
      console.log(`Session ${sid} cleanup:`, error.message);
    } finally {
      if (isCurrentSession) {
        setSessionId(null);
        sessionIdRef.current = null;
        setSessionIdForApi(null);
      }
    }
  }, []);

  // Handle API errors that indicate session death
  const handleSessionError = useCallback((error) => {
    const status = error.response?.status;
    if (status === 404) {
      setSessionError("Session expired or not found. Please start a new debug session.");
      setSessionId(null);
      setWsToken(null);
      sessionIdRef.current = null;
      setSessionIdForApi(null);
      return true;  // Error was handled
    }
    return false;  // Caller should handle other errors
  }, []);

  useEffect(() => {
    isMounted.current = true;
    createSession();

    return () => {
      isMounted.current = false;
      const currentId = sessionIdRef.current;
      if (currentId) {
        endSession(currentId);
      }
    };
  }, []);

  return {
    sessionId,
    wsToken,
    sessionLoading,
    sessionError,
    setSessionError,
    createSession,
    endSession,
    handleSessionError,
    clearSessionError: () => {
      setSessionError(null);
    }
  };
};

export default useSession;
