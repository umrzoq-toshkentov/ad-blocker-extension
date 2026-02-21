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
    // Poll every 3 seconds while panel is open
    const interval = setInterval(loadStats, 3000);
    return () => clearInterval(interval);
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

  const sortedDomains = Object.entries(stats.blockedByDomain).sort(([, a], [, b]) => b - a);
  const totalDomains = sortedDomains.length;
  const maxCount = sortedDomains[0]?.[1] ?? 1;

  return (
    <div className="panel">
      <header className="panel-header">
        <div className="header-left">
          <svg className="shield" viewBox="0 0 24 24" fill="none">
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
            <h1>Ad Blocker</h1>
            <p className="subtitle">{stats.enabled ? "Protecting you" : "Paused"}</p>
          </div>
        </div>
        <button
          className={`toggle ${stats.enabled ? "on" : "off"}`}
          onClick={handleToggle}
          disabled={toggling}
        >
          <span className="knob" />
        </button>
      </header>

      <div className="stats-row">
        <div className="stat">
          <span className="num green">{stats.sessionBlocked.toLocaleString()}</span>
          <span className="lbl">Session</span>
        </div>
        <div className="divider" />
        <div className="stat">
          <span className="num green">{stats.totalBlocked.toLocaleString()}</span>
          <span className="lbl">All time</span>
        </div>
        <div className="divider" />
        <div className="stat">
          <span className="num">{totalDomains}</span>
          <span className="lbl">Ad domains</span>
        </div>
      </div>

      <section className="domains-section">
        <div className="section-header">
          <h2>Blocked by domain</h2>
          <button className="text-btn" onClick={handleReset}>
            Reset
          </button>
        </div>

        {sortedDomains.length === 0 ? (
          <div className="empty">
            <p>No blocked requests yet.</p>
            <p className="empty-sub">Browse around and ads will appear here.</p>
          </div>
        ) : (
          <ul className="domain-list">
            {sortedDomains.map(([domain, count]) => (
              <li key={domain} className="domain-row">
                <div className="domain-info">
                  <span className="domain">{domain}</span>
                  <span className="count">{count}</span>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="panel-footer">
        <span>50 network rules active</span>
        <span>DOM hiding enabled</span>
      </footer>
    </div>
  );
}
