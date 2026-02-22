import "./App.css";

const FEATURES = [
  {
    icon: "🛡️",
    title: "Network blocking",
    desc: "50 rules block ad requests before they even load — zero page slowdown.",
  },
  {
    icon: "🙈",
    title: "DOM element hiding",
    desc: "CSS injection hides ad containers that slip through network rules.",
  },
  {
    icon: "📊",
    title: "Block statistics",
    desc: "Track how many ads are blocked per session and across all time.",
  },
  {
    icon: "⏸️",
    title: "One-click pause",
    desc: "Instantly pause and resume blocking from the popup or side panel.",
  },
];

export default function App() {
  return (
    <div className="welcome">
      <div className="hero">
        <div className="shield-wrap">
          <svg className="shield" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
              fill="#4ade80"
              stroke="#22c55e"
              strokeWidth="1.5"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="hero-title">
          Ad Blocker <span className="installed-badge">Installed</span>
        </h1>
        <p className="hero-sub">
          You're protected. Ads and trackers are being blocked automatically on every site you
          visit.
        </p>
      </div>

      <section className="features">
        <h2 className="section-label">What's included</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-to">
        <h2 className="section-label">Getting started</h2>
        <ol className="steps">
          <li>
            <span className="step-num">1</span>
            <div>
              <strong>Click the extension icon</strong> in your toolbar to see live block stats.
            </div>
          </li>
          <li>
            <span className="step-num">2</span>
            <div>
              <strong>Open the side panel</strong> for a detailed breakdown by domain.
            </div>
          </li>
          <li>
            <span className="step-num">3</span>
            <div>
              <strong>Toggle the switch</strong> to pause blocking on sites that need it.
            </div>
          </li>
        </ol>
      </section>

      <footer className="welcome-footer">
        <p>Ad Blocker is active and protecting you right now.</p>
      </footer>
    </div>
  );
}
