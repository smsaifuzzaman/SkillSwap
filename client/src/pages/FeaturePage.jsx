import { CheckCircle2 } from "lucide-react";
import React from "react";

function FeaturePage({ feature }) {
  if (!feature) {
    return null;
  }

  return (
    <section className="feature-page">
      <div className="feature-detail">
        <div className="feature-main">
          <p className="eyebrow">{feature.eyebrow}</p>
          <h1>{feature.title}</h1>
          <p>{feature.summary}</p>

          <div className="placeholder-panel">
            <span>Frontend-only demo page</span>
            <strong>Backend and database connection will be added later.</strong>
          </div>
        </div>

        <aside className="feature-side">
          <div className="metric-box">
            <strong>{feature.metric}</strong>
            <span>{feature.metricLabel}</span>
          </div>

          <div className="checklist">
            {feature.bullets.map((item) => (
              <div className="check-row" key={item}>
                <CheckCircle2 size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default FeaturePage;
