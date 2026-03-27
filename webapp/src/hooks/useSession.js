import { useEffect } from "react";
import { DataState } from "../context/DataContext";

const POLL_INTERVAL = 5000;

const useSession = () => {
  const { sessionId, setSessionId, setConnectionStatus } = DataState();
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

  useEffect(() => {
    if (sessionId) {
      return;
    }

    const createSession = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/create_session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to create session");
        }
        const data = await response.json();
        setSessionId(data?.session_id ?? null);
      } catch {
        setSessionId(null);
      }
    };

    createSession();
  }, [apiBaseUrl, sessionId, setSessionId]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`);
        if (response.ok) {
          setConnectionStatus("Connected");
        } else {
          setConnectionStatus("Disconnected");
        }
      } catch {
        setConnectionStatus("Disconnected");
      }
    };

    setConnectionStatus("Connecting...");
    checkConnection();

    // Re-check every 5 seconds
    const interval = setInterval(() => {
      checkConnection();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [apiBaseUrl, setConnectionStatus]);
};

export default useSession;
