import { useEffect } from "react";
import { DataState } from "../context/DataContext";

const useSession = () => {
  const { setSessionId, setConnectionStatus } = DataState();

  useEffect(() => {
    // Generate UUID if it doesn't exist
    const generateId = () => {
      return (
        crypto.randomUUID?.() ||
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
    };
    setSessionId(prev => prev ?? generateId());

    const checkConnection = async () => {
      try {
        const response = await fetch("http://127.0.0.1:10000/health");
        if (response.ok) {
          setConnectionStatus("Connected");
        } else {
          setConnectionStatus("Disconnected");
        }
      } catch (error) {
        setConnectionStatus("Disconnected");
      }
    };

    setConnectionStatus("Connecting...");
    checkConnection();

    // Re-check every 5 seconds
    const interval = setInterval(() => {
      checkConnection();
    }, 5000);

    return () => clearInterval(interval);
  }, [setSessionId, setConnectionStatus]);
};

export default useSession;
