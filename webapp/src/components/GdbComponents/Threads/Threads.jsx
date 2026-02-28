import React, { useEffect, useState, useContext } from "react";
import "./Threads.css";
import api from "../../../api";
import { DataContext } from "../../../context/DataContext";

const Threads = () => {
  const { refresh } = useContext(DataContext);
  const [threads, setThreads] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchThreadsData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/threads", {
        name: "temp",
      });
      if (response.data.success) {
        setThreads(response.data.result);
      } else {
        setError(response.data.error || "Failed to fetch threads");
      }
    } catch (err) {
      console.log(err);
      setError("Failed to fetch threads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadsData();
  }, [refresh]);

  const hasThreads = threads && !threads.toLowerCase().includes("no threads");

  return (
    <div>
      <div className="threads">
        <div className="threads-component">
          <div className="threads-component-part1">func</div>
          <div className="threads-component-part2">file</div>
          <div className="threads-component-part3">addr</div>
          <div className="threads-component-part4">args</div>
        </div>

        <div className="threads-lower">
          {loading && <div>Loading...</div>}
          {error && <div>{error}</div>}
          {!loading && !error && hasThreads && <pre>{threads}</pre>}
          {!loading && !error && !hasThreads && (
            <div>No active threads.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Threads;