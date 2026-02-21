import { useEffect, useState } from "react";
import "./App.css";

interface Stats {
  enabled: boolean;
  totalBlocked: number;
  sessionBlocked: number;
  blockedByDomain: Record<string, number>;
}

export default function App() {
  const [stats, setStats] = useState<Stats>({
    enabled: true,
    totalBlocked: 0,
    sessionBlocked: 0,
    blockedByDomain: {},
  });
  const [toggling, setToggling] = useState(false);

  const loadStats = () => {
    chrome.runtime.sendMessage({ type: "GET_STATS" }, (response) => {
      if (response) setStats(response as Stats);
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleToggle = () => {
    setToggling(true);
    chrome.runtime.sendMessage({ type: "TOGGLE_ENABLED" }, (response) => {
      if (response) setStats((s) => ({ ...s, enabled: response.enabled }));
      setToggling(false);
    });
  };

  const handleReset = () => {
    chrome.runtime.sendMessage({ type: "RESET_STATS" }, () => {
      setStats((s) => ({ ...s, totalBlocked: 0, sessionBlocked: 0, blockedByDomain: {} }));
    });
  };

  const topDomains = Object.entries(stats.blockedByDomain)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="popup">
      <header className="popup-header">
        <div className="logo-row">
          <svg className="shield-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
              fill={stats.enabled ? "#4ade80" : "#6b7280"}
              stroke={stats.enabled ? "#22c55e" : "#4b5563"}
              strokeWidth="1.5"
            />
            {stats.enabled && (
              <path
                d="M9 12l2 2 4-4"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
          <div>
            <h1 className="app-title">Ad Blocker</h1>
            <span className={`status-badge ${stats.enabled ? "active" : "inactive"}`}>
              {stats.enabled ? "Active" : "Paused"}
            </span>
          </div>
        </div>

        <button
          className={`toggle-btn ${stats.enabled ? "on" : "off"}`}
          onClick={handleToggle}
          disabled={toggling}
          title={stats.enabled ? "Pause ad blocking" : "Resume ad blocking"}
        >
          <span className="toggle-knob" />
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-number">{stats.sessionBlocked.toLocaleString()}</span>
          <span className="stat-label">This session</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-number">{stats.totalBlocked.toLocaleString()}</span>
          <span className="stat-label">All time</span>
        </div>
      </div>

      {topDomains.length > 0 && (
        <div className="domains-section">
          <h2 className="section-title">Top blocked</h2>
          <ul className="domain-list">
            {topDomains.map(([domain, count]) => (
              <li key={domain} className="domain-item">
                <span className="domain-name">{domain}</span>
                <span className="domain-count">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="popup-footer">
        <button className="reset-btn" onClick={handleReset}>
          Reset stats
        </button>
        <span className="rule-count">50 rules active</span>
      </footer>
    </div>
  );
}
