import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:10000";

const MAX_LINES = 1000;

function formatLine(response) {
  const payload = response?.payload;
  if (payload == null) return "";
  return String(payload).trimEnd();
}

export function useStreamingOutput(sessionId, wsToken) {
  const [lines, setLines] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const linesRef = useRef([]);

  const connect = useCallback(() => {
    if (!sessionId || !wsToken) return;

    const socket = io(`${API_BASE}/ws/debug`, {
      query: { session_id: sessionId, ws_token: wsToken },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("gdb_output", (data) => {
      const text = formatLine(data);
      if (!text) return;
      linesRef.current = [...linesRef.current, text].slice(-MAX_LINES);
      setLines(linesRef.current);
    });

    socket.on("session_expired", () => {
      setIsConnected(false);
      setError("Session expired. Please create a new debug session.");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
      setError("Failed to connect to debug stream.");
    });

    socketRef.current = socket;
  }, [sessionId, wsToken]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const clearOutput = useCallback(() => {
    linesRef.current = [];
    setLines([]);
    setError(null);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { lines, isConnected, error, disconnect, clearOutput };
}

export default useStreamingOutput;
