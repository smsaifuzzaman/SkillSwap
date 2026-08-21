import React, { useEffect, useMemo, useState } from "react";

import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Crown,
  Lock,
  Medal,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy
} from "lucide-react";

import {
  evaluateAchievements,
  generateCertificate,
  getCertificateEligibleTrackers,
  getMyAchievements,
  getMyCertificates
} from "../api/achievementApi.js";

const badgeIcons = {
  milestone_master: Trophy,
  learning_path_finisher: Award,
  swap_starter: Sparkles,
  highly_rated: Star,
  consistent_learner: Medal
};

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

function AchievementsPage({ token }) {
  const [achievementData, setAchievementData] = useState({
    membershipPlan: "Free",
    achievements: [],
    badgeCatalog: []
  });

  const [eligibleData, setEligibleData] = useState({
    membershipPlan: "Free",
    eligibleTrackers: []
  });

  const [certificates, setCertificates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------------------------------
  // LOAD FEATURE 3 DATA
  // ----------------------------------------------------

  useEffect(() => {
    async function loadAchievements() {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        await evaluateAchievements(token);

        const [
          badges,
          eligible,
          certificateData
        ] = await Promise.all([
          getMyAchievements(token),
          getCertificateEligibleTrackers(token),
          getMyCertificates(token)
        ]);

        setAchievementData(badges);

        setEligibleData(eligible);

        setCertificates(
          certificateData.certificates || []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load achievements."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAchievements();
  }, [token]);

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------

  const earnedCount = useMemo(
    () =>
      achievementData.badgeCatalog.filter(
        (badge) => badge.earned
      ).length,
    [achievementData.badgeCatalog]
  );

  const lockedCount = useMemo(
    () =>
      achievementData.badgeCatalog.filter(
        (badge) => !badge.earned
      ).length,
    [achievementData.badgeCatalog]
  );

  const membershipPlan =
    achievementData.membershipPlan ||
    eligibleData.membershipPlan ||
    "Free";

  const isPremium =
    membershipPlan === "Premium";

  // ----------------------------------------------------
  // GENERATE CERTIFICATE
  // ----------------------------------------------------

  async function handleGenerateCertificate(trackerId) {
    try {
      setProcessingId(trackerId);
      setError("");
      setSuccess("");

      const data = await generateCertificate(
        token,
        trackerId
      );

      setCertificates((current) => [
        data.certificate,
        ...current
      ]);

      setSuccess(
        data.message ||
          "Certificate generated successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to generate certificate."
      );
    } finally {
      setProcessingId("");
    }
  }

  // ----------------------------------------------------
  // CHECK IF CERTIFICATE ALREADY EXISTS
  // ----------------------------------------------------

  function hasCertificateForTracker(trackerId) {
    return certificates.some((certificate) => {
      const progressTracker =
        certificate.progressTracker;

      if (!progressTracker) {
        return false;
      }

      if (typeof progressTracker === "string") {
        return progressTracker === trackerId;
      }

      return (
        progressTracker._id === trackerId ||
        progressTracker.id === trackerId
      );
    });
  }

  // ----------------------------------------------------
  // PAGE
  // ----------------------------------------------------

  return (
    <div className="portfolio-page achievements-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">
            Recognition & Credentials
          </p>

          <h1>
            Achievements
          </h1>

          <p>
            Earn badges from real SkillSwap activity
            and unlock verified learning certificates
            when completed paths meet the requirements.
          </p>
        </div>

        <div className="portfolio-stat earned-badge-stat">
          <Award size={32} />

          <strong>
            {earnedCount}
          </strong>

          <span>
            Badges Earned
          </span>
        </div>
      </div>

      {error ? (
        <p
          className="form-error"
          style={{
            marginTop: "1rem"
          }}
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className="form-note"
          style={{
            marginTop: "1rem"
          }}
        >
          {success}
        </p>
      ) : null}

      <div className="achievement-summary-grid">
        <div className="portfolio-stat">
          <Lock size={28} />

          <strong>
            {lockedCount}
          </strong>

          <span>
            locked Badges
          </span>
        </div>

        <div className="portfolio-stat">
          <Crown size={28} />

          <strong>
            {membershipPlan}
          </strong>

          <span>
            Membership Plan
          </span>
        </div>
      </div>

      <section className="achievement-section">
        <div className="feed-heading">
          <h2>
            Badge Collection
          </h2>

          <span>
            {earnedCount} /{" "}
            {achievementData.badgeCatalog.length} earned
          </span>
        </div>

        {loading ? (
          <p>
            Loading achievements...
          </p>
        ) : null}

        <div className="badge-grid">
          {achievementData.badgeCatalog.map(
            (badge) => {
              const Icon =
                badgeIcons[badge.badgeKey] ||
                Award;

              return (
                <article
                  className={`achievement-badge-card ${
                    badge.earned
                      ? "earned"
                      : "locked"
                  }`}
                  key={badge.badgeKey}
                >
                  <div className="achievement-badge-icon">
                    {badge.earned ? (
                      <Icon size={32} />
                    ) : (
                      <Lock size={28} />
                    )}
                  </div>

                  <div>
                    <span className="match-label">
                      {badge.earned
                        ? "Earned"
                        : "Locked"}
                    </span>

                    <h3>
                      {badge.title}
                    </h3>

                    <p>
                      {badge.description}
                    </p>
                  </div>

                  {badge.earned ? (
                    <div className="achievement-earned-row">
                      <CheckCircle2 size={16} />
                      Achievement unlocked
                    </div>
                  ) : null}
                </article>
              );
            }
          )}
        </div>
      </section>

      <section className="achievement-section certificate-section">
        <div className="feed-heading">
          <h2>
            Verified Certificates
          </h2>

          <span>
            {eligibleData.eligibleTrackers.length} eligible
          </span>
        </div>

        {!isPremium ? (
          <div className="certificate-premium-note">
            <Crown size={22} />

            <div>
              <strong>
                Premium certificate access
              </strong>

              <span>
                You have completed learning paths,
                but verified certificate generation
                is available to Premium users only.
              </span>
            </div>
          </div>
        ) : null}

        {eligibleData.eligibleTrackers.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={30} />

            <strong>
              No certificate-ready paths yet
            </strong>

            <span>
              Complete all milestones in a learning
              path to become eligible.
            </span>
          </div>
        ) : (
          <div className="certificate-eligible-grid">
            {eligibleData.eligibleTrackers.map(
              (tracker) => {
                const alreadyGenerated =
                  hasCertificateForTracker(
                    tracker.id
                  );

                return (
                  <article
                    className="certificate-eligible-card"
                    key={tracker.id}
                  >
                    <div>
                      <span className="match-label">
                        Certificate Eligible
                      </span>

                      <h3>
                        {tracker.skillName}
                      </h3>

                      <p>
                        {tracker.title}
                      </p>

                      <small>
                        Completed:{" "}
                        {formatDate(
                          tracker.completedAt
                        )}
                      </small>
                    </div>

                    {alreadyGenerated ? (
                      <span className="certificate-generated-pill">
                        <BadgeCheck size={16} />
                        Generated
                      </span>
                    ) : (
                      <button
                        className={
                          isPremium
                            ? "primary-button small"
                            : "ghost-button small"
                        }
                        type="button"
                        disabled={
                          !isPremium ||
                          processingId === tracker.id
                        }
                        onClick={() =>
                          handleGenerateCertificate(
                            tracker.id
                          )
                        }
                        title={
                          isPremium
                            ? ""
                            : "Premium membership required."
                        }
                      >
                        <ShieldCheck size={16} />

                        {processingId === tracker.id
                          ? "Generating..."
                          : isPremium
                          ? "Generate Certificate"
                          : "Premium Required"}
                      </button>
                    )}
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="achievement-section">
        <div className="feed-heading">
          <h2>
            My Certificates
          </h2>

          <span>
            {certificates.length} generated
          </span>
        </div>

        {certificates.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={30} />

            <strong>
              No generated certificates yet
            </strong>

            <span>
              Premium users can generate verified
              certificates from completed learning
              paths.
            </span>
          </div>
        ) : (
          <div className="certificate-list">
            {certificates.map((certificate) => (
              <article
                className="certificate-card"
                key={certificate._id}
              >
                <div className="certificate-card-icon">
                  <ShieldCheck size={34} />
                </div>

                <div>
                  <span className="match-label">
                    {certificate.status}
                  </span>

                  <h3>
                    {certificate.title}
                  </h3>

                  <p>
                    {certificate.skillName}
                  </p>

                  <small>
                    Issued:{" "}
                    {formatDate(
                      certificate.issuedAt
                    )}
                  </small>

                  <code>
                    {
                      certificate.verificationCode
                    }
                  </code>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AchievementsPage;