import { useState, useEffect, useRef } from "react";
import api from "../api";

const useSession = () => {
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const sessionIdRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const createSession = async () => {
            try {
                const { data } = await api.post("/create_session");
                if (!cancelled && data.success) {
                    setSessionId(data.session_id);
                    sessionIdRef.current = data.session_id;
                } else if (!cancelled) {
                    setError("Failed to create session");
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Failed to create session");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        createSession();

        return () => {
            cancelled = true;
            if (sessionIdRef.current) {
                api.post("/end_session", { session_id: sessionIdRef.current }).catch(() => { });
            }
        };
    }, []);

    return { sessionId, loading, error };
};

export default useSession;
