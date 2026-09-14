import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api";
import "./MultiSession.css";

const DebugPanel = ({ label }) => {
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [command, setCommand] = useState("");
    const [code, setCode] = useState("");
    const [compiling, setCompiling] = useState(false);
    const [logs, setLogs] = useState([]);
    const sessionIdRef = useRef(null);
    const logsEndRef = useRef(null);

    const createSession = useCallback(async () => {
        setLoading(true);
        setError(null);
        setLogs([]);

        try {
            const { data } = await api.post("/create_session");
            if (data.success) {
                setSessionId(data.session_id);
                sessionIdRef.current = data.session_id;
                setLogs([{ type: "system", text: `Session created: ${data.session_id}` }]);
            } else {
                setError(data.error || "Failed to create session");
            }
        } catch (err) {
            const status = err.response?.status;
            let message = "Failed to connect to backend";
            if (status === 503) {
                message = "Server capacity reached (MAX_SESSIONS - HTTP 503). Please try again later.";
            } else if (status === 429) {
                message = "Rate limited. Please wait before creating a new session.";
            } else if (status === 404) {
                message = "Session manager endpoint not found (HTTP 404).";
            } else if (err.message) {
                message = err.message;
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    const endSession = useCallback(async (sid) => {
        if (!sid) return;
        try {
            await api.post("/end_session", { session_id: sid });
        } catch (e) { }
        if (sessionIdRef.current === sid) {
            sessionIdRef.current = null;
            setSessionId(null);
        }
    }, []);

    useEffect(() => {
        createSession();
        return () => {
            const currentId = sessionIdRef.current;
            if (currentId) {
                endSession(currentId);
            }
        };
    }, [createSession, endSession]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    }, [logs]);

    const handleResetSession = async () => {
        const currentId = sessionIdRef.current;
        if (currentId) {
            await endSession(currentId);
        }
        await createSession();
    };

    const handleCompile = async () => {
        const currentId = sessionIdRef.current;
        if (!currentId) {
            setLogs((prev) => [...prev, { type: "error", text: "No active session." }]);
            return;
        }
        if (!code.trim()) {
            setLogs((prev) => [...prev, { type: "error", text: "Write a program before compiling." }]);
            return;
        }
        setCompiling(true);
        try {
            const { data } = await api.post("/compile", {
                code,
                name: "program.cpp",
                session_id: currentId,
            });
            setLogs((prev) => [...prev, { type: "system", text: data.success ? "Program compiled" : `Compile failed: ${data.error || "unknown"}` }]);
        } catch (err) {
            setLogs((prev) => [...prev, { type: "error", text: `Compile request failed: ${err.message}` }]);
        } finally {
            setCompiling(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!command.trim()) return;

        const currentId = sessionIdRef.current;
        if (!currentId) {
            setLogs((prev) => [...prev, { type: "error", text: "No active session." }]);
            return;
        }

        const cmd = command.trim();
        setCommand("");
        setLogs((prev) => [...prev, { type: "input", text: `(gdb) ${cmd}` }]);

        try {
            const { data } = await api.post("/gdb_command", {
                command: cmd,
                name: "program",
                session_id: currentId,
            });
            const text = data.success ? data.result : `Error: ${data.error}`;
            setLogs((prev) => [...prev, { type: "output", text }]);
        } catch (err) {
            const status = err.response?.status;
            let errMsg = `Request failed: ${err.message}`;
            if (status === 404) {
                errMsg = "Session expired or not found. Please reset the session.";
                setSessionId(null);
                sessionIdRef.current = null;
                setError("Session expired or not found. Please start a new debug session.");
            } else if (status === 409) {
                errMsg = "Conflict: GDB is currently running a program or compiler is busy.";
            }
            setLogs((prev) => [...prev, { type: "error", text: errMsg }]);
        }
    };

    return (
        <div className="multi-session-panel">
            <div className="multi-session-panel-header">
                <h3>{label}</h3>
                <button className="multi-session-reset-btn" onClick={handleResetSession} disabled={loading}>
                    Reset Session
                </button>
            </div>
            {sessionId && (
                <div className="multi-session-session-id">
                    Session: <span>{sessionId}</span>
                </div>
            )}
            
            {loading && (
                <div className="multi-session-status multi-session-loading">
                    <div className="pulse-spinner" style={{ width: "20px", height: "20px" }}></div>
                    <span>Creating session...</span>
                </div>
            )}
            
            {error && (
                <div className="multi-session-status multi-session-error">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button className="multi-session-recreate-btn" onClick={handleResetSession}>
                        Recreate Session
                    </button>
                </div>
            )}

            <div className="multi-session-code">
                <textarea
                    className="multi-session-code-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Write your C++ program, then click Compile."
                    rows={6}
                    spellCheck={false}
                    disabled={loading || !!error}
                />
                <button
                    className="multi-session-compile-btn"
                    onClick={handleCompile}
                    disabled={compiling || loading || !!error}
                >
                    {compiling ? "Compiling..." : "Compile"}
                </button>
            </div>

            <div className="multi-session-logs">
                {logs.map((log, i) => (
                    <div key={i} className={`multi-session-log multi-session-log-${log.type}`}>
                        <pre>{log.text}</pre>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>

            <form className="multi-session-input-form" onSubmit={handleSubmit}>
                <span className="multi-session-prompt">(gdb)</span>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter GDB command..."
                    disabled={loading || !!error}
                    autoFocus={label === "Panel A"}
                />
            </form>
        </div>
    );
};

const MultiSession = () => {
    return (
        <div className="multi-session-container">
            <div className="multi-session-title-bar">
                <h1>Multi-User Session Debugger</h1>
            </div>

            <p className="multi-session-description">
                Each panel runs an independent GDB session. Commands in Panel A do not affect Panel B.
                This proves session isolation works correctly. Write a program, compile it, then debug.
            </p>

            <div className="multi-session-panels">
                <DebugPanel label="Panel A" />
                <DebugPanel label="Panel B" />
            </div>

            <div className="multi-session-hints">
                <h4>Try these commands:</h4>
                <div className="multi-session-hint-chips">
                    <code>run</code>
                    <code>break 10</code>
                    <code>next</code>
                    <code>step</code>
                    <code>continue</code>
                    <code>info locals</code>
                    <code>bt</code>
                    <code>info registers</code>
                    <code>info threads</code>
                    <code>watch x</code>
                    <code>print val</code>
                </div>
            </div>
        </div>
    );
};

export default MultiSession;
