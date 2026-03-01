import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api";
import "./Demo.css";

const MOCK_RESPONSES = {
    "info locals": "i = 5\nsum = 15\narr = {1, 2, 3, 4, 5}",
    "bt": "#0  main () at program.cpp:12\n#1  0x00007ffff7a2d830 in __libc_start_main ()\n#2  0x0000000000400499 in _start ()",
    "info breakpoints": "Num  Type        Disp Enb Address            What\n1    breakpoint  keep y   0x0000000000400526 in main at program.cpp:8\n2    breakpoint  keep y   0x0000000000400540 in main at program.cpp:12",
    "info registers": "rax  0x5   5\nrbx  0x0   0\nrcx  0xf   15\nrdx  0x7   7\nrsp  0x7fffffffe260\nrbp  0x7fffffffe280",
    "info threads": "  Id   Target Id         Frame\n* 1    Thread 0x7ffff7a2d740  main () at program.cpp:12",
    "next": "13\t    sum += arr[i];",
    "step": "Stepped into: add(int, int) at math.cpp:5",
    "continue": "Continuing.\nBreakpoint 2, main () at program.cpp:12\n12\t    int result = sum;",
    "run": "Starting program: /output/program.exe\nBreakpoint 1, main () at program.cpp:8\n8\t    int sum = 0;",
};

const getMockResponse = (command) => {
    const cmd = command.toLowerCase().trim();
    for (const [key, value] of Object.entries(MOCK_RESPONSES)) {
        if (cmd.startsWith(key) || cmd === key) {
            return value;
        }
    }
    if (cmd.startsWith("break ")) {
        const loc = cmd.replace("break ", "");
        return `Breakpoint 3 at 0x400550: file program.cpp, line ${loc}.`;
    }
    if (cmd.startsWith("watch ")) {
        const v = cmd.replace("watch ", "");
        return `Hardware watchpoint 4: ${v}`;
    }
    if (cmd.startsWith("print ")) {
        const v = cmd.replace("print ", "");
        return `$1 = 42`;
    }
    return `(gdb) ${command}\nNo symbol table is loaded.`;
};

const DebugPanel = ({ label, isMockMode }) => {
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [command, setCommand] = useState("");
    const [logs, setLogs] = useState([]);
    const sessionIdRef = useRef(null);
    const logsEndRef = useRef(null);

    const createSession = useCallback(async () => {
        setLoading(true);
        setError(null);
        setLogs([]);

        if (isMockMode) {
            const mockId = "mock-" + Math.random().toString(36).substring(2, 10);
            setSessionId(mockId);
            sessionIdRef.current = mockId;
            setLoading(false);
            setLogs([{ type: "system", text: `Mock session created: ${mockId}` }]);
            return;
        }

        try {
            const { data } = await api.post("/create_session");
            if (data.success) {
                setSessionId(data.session_id);
                sessionIdRef.current = data.session_id;
                setLogs([{ type: "system", text: `Session created: ${data.session_id}` }]);
            } else {
                setError("Failed to create session");
            }
        } catch (err) {
            setError(err.message || "Failed to connect to backend");
        } finally {
            setLoading(false);
        }
    }, [isMockMode]);

    const endSession = useCallback(async () => {
        if (!sessionIdRef.current) return;
        if (!isMockMode) {
            try {
                await api.post("/end_session", { session_id: sessionIdRef.current });
            } catch (e) { }
        }
        sessionIdRef.current = null;
        setSessionId(null);
    }, [isMockMode]);

    useEffect(() => {
        createSession();
        return () => { endSession(); };
    }, [isMockMode]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handleResetSession = async () => {
        await endSession();
        await createSession();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!command.trim() || !sessionId) return;

        const cmd = command.trim();
        setCommand("");
        setLogs((prev) => [...prev, { type: "input", text: `(gdb) ${cmd}` }]);

        if (isMockMode) {
            await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
            const result = getMockResponse(cmd);
            setLogs((prev) => [...prev, { type: "output", text: result }]);
            return;
        }

        try {
            const { data } = await api.post("/gdb_command", {
                command: cmd,
                name: "program",
                session_id: sessionId,
            });
            const text = data.success ? data.result : `Error: ${data.error}`;
            setLogs((prev) => [...prev, { type: "output", text }]);
        } catch (err) {
            setLogs((prev) => [...prev, { type: "error", text: `Request failed: ${err.message}` }]);
        }
    };

    return (
        <div className="demo-panel">
            <div className="demo-panel-header">
                <h3>{label}</h3>
                <button className="demo-reset-btn" onClick={handleResetSession} disabled={loading}>
                    Reset Session
                </button>
            </div>
            {sessionId && (
                <div className="demo-session-id">
                    Session: <span>{sessionId}</span>
                </div>
            )}
            {loading && <div className="demo-status demo-loading">Creating session...</div>}
            {error && <div className="demo-status demo-error">{error}</div>}

            <div className="demo-logs">
                {logs.map((log, i) => (
                    <div key={i} className={`demo-log demo-log-${log.type}`}>
                        <pre>{log.text}</pre>
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>

            <form className="demo-input-form" onSubmit={handleSubmit}>
                <span className="demo-prompt">(gdb)</span>
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

const Demo = () => {
    const [isMockMode, setIsMockMode] = useState(true);

    return (
        <div className="demo-container">
            <div className="demo-title-bar">
                <h1>Multi-User Session Demo</h1>
                <div className="demo-mode-toggle">
                    <label className="demo-switch">
                        <input
                            type="checkbox"
                            checked={!isMockMode}
                            onChange={() => setIsMockMode(!isMockMode)}
                        />
                        <span className="demo-slider"></span>
                    </label>
                    <span className="demo-mode-label">
                        {isMockMode ? "MOCK" : "LIVE"}
                    </span>
                </div>
            </div>

            {isMockMode && (
                <div className="demo-mock-banner">
                    MOCK MODE — Simulated GDB responses. Toggle to LIVE to connect to the Flask backend.
                </div>
            )}

            <p className="demo-description">
                Each panel runs an independent GDB session. Commands in Panel A do not affect Panel B.
                This proves session isolation works correctly.
            </p>

            <div className="demo-panels">
                <DebugPanel label="Panel A" isMockMode={isMockMode} />
                <DebugPanel label="Panel B" isMockMode={isMockMode} />
            </div>

            <div className="demo-hints">
                <h4>Try these commands:</h4>
                <div className="demo-hint-chips">
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

export default Demo;
