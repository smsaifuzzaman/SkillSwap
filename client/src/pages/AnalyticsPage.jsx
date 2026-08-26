import React, { useEffect, useState } from "react";
import { getMyAnalytics, getPopularSkills, getRecommendations, getEngagementTrends } from "../api/analyticsApi.js";
import { BarChart3 } from "lucide-react";

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(18, 14, 40, 0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "1rem",
        padding: "1.25rem",
        textAlign: "center",
        flex: "1 1 160px"
      }}
    >
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--lavender)" }}>{value}</div>
      <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

export default function AnalyticsPage({ user, token }) {
  const isAdmin = user?.role === "system-admin";

  const [myStats, setMyStats] = useState(null);
  const [popular, setPopular] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [stats, popularSkills, recs] = await Promise.all([
          getMyAnalytics(token),
          getPopularSkills(token, 10),
          getRecommendations(token)
        ]);
        setMyStats(stats);
        setPopular(popularSkills);
        setRecommendations(recs);

        if (isAdmin) {
          const trend = await getEngagementTrends(token, 30);
          setEngagement(trend);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, isAdmin]);

  if (loading) {
    return <div className="portfolio-page"><p className="text-muted">Loading analytics...</p></div>;
  }

  return (
    <div className="portfolio-page">
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <BarChart3 size={22} /> Skill Analytics Dashboard
      </h2>

      {error ? <p className="form-error">{error}</p> : null}

      {myStats ? (
        <>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", margin: "1.5rem 0" }}>
            <MetricCard label="Total Swaps Requested" value={myStats.totalSwapsRequested} />
            <MetricCard label="Completed Swaps" value={myStats.completedSwaps} />
            <MetricCard label="Completed Sessions" value={myStats.totalCompletedSessions} />
            <MetricCard label="Minutes in Sessions" value={myStats.totalMinutesInSessions} />
          </div>

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 220px" }}>
              <h3 style={{ color: "var(--cream)" }}>Skills Taught</h3>
              {myStats.skillsTaught?.length ? (
                <ul style={{ color: "var(--muted)" }}>
                  {myStats.skillsTaught.map((s) => <li key={s}>{s}</li>)}
                </ul>
              ) : (
                <p className="text-muted">None yet.</p>
              )}
            </div>
            <div style={{ flex: "1 1 220px" }}>
              <h3 style={{ color: "var(--cream)" }}>Skills Learned</h3>
              {myStats.skillsLearned?.length ? (
                <ul style={{ color: "var(--muted)" }}>
                  {myStats.skillsLearned.map((s) => <li key={s}>{s}</li>)}
                </ul>
              ) : (
                <p className="text-muted">None yet.</p>
              )}
            </div>
          </div>
        </>
      ) : null}

      <h3 style={{ color: "var(--cream)", marginTop: "2rem" }}>Most In-Demand Skills</h3>
      {popular.length === 0 ? (
        <p className="text-muted">Not enough data yet.</p>
      ) : (
        <ul style={{ color: "var(--muted)" }}>
          {popular.map((p) => (
            <li key={p.skill}>{p.skill} — {p.count} requests</li>
          ))}
        </ul>
      )}

      <h3 style={{ color: "var(--cream)", marginTop: "2rem" }}>Recommended For You</h3>
      {recommendations.length === 0 ? (
        <p className="text-muted">No new recommendations right now.</p>
      ) : (
        <ul style={{ color: "var(--muted)" }}>
          {recommendations.map((r) => (
            <li key={r.skill}>{r.skill} (demand score: {r.demandScore})</li>
          ))}
        </ul>
      )}

      {isAdmin ? (
        <>
          <h3 style={{ color: "var(--cream)", marginTop: "2rem" }}>Platform Engagement (last 30 days)</h3>
          {engagement.length === 0 ? (
            <p className="text-muted">No activity in this window yet.</p>
          ) : (
            <table style={{ width: "100%", color: "var(--muted)", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "0.5rem" }}>Date</th>
                  <th style={{ padding: "0.5rem" }}>Swaps Created</th>
                  <th style={{ padding: "0.5rem" }}>Accepted</th>
                </tr>
              </thead>
              <tbody>
                {engagement.map((row) => (
                  <tr key={row._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.5rem" }}>{row._id}</td>
                    <td style={{ padding: "0.5rem" }}>{row.swapsCreated}</td>
                    <td style={{ padding: "0.5rem" }}>{row.accepted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : null}
    </div>
  );
}
