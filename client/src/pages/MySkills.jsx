import React, { useEffect, useState } from "react";
import {
  Trash2,
  BookOpen,
  GraduationCap,
  Zap,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle
} from "lucide-react";

import {
  getSkills,
  deleteSkill,
  boostSkillListing,
  renewSkillListingBoost
} from "../api/skillApi";

const BOOST_PRICE = 100;
const BOOST_DURATION_DAYS = 7;
const MAX_ACTIVE_BOOSTS = 3;

const MySkills = ({ token }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [processingSkillId, setProcessingSkillId] = useState(null);

  useEffect(() => {
    fetchSkills();
  }, [token]);

  async function fetchSkills() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getSkills(token);

      setSkills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load skills", error);

      showToast(
        error.message || "Failed to load your skills."
      );
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // DELETE SKILL
  // ----------------------------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this skill?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingSkillId(id);

      await deleteSkill(token, id);

      setSkills((currentSkills) =>
        currentSkills.filter((skill) => skill._id !== id)
      );

      showToast("Skill deleted successfully.");
    } catch (error) {
      console.error("Failed to delete skill", error);

      showToast(
        error.message || "Failed to delete skill."
      );
    } finally {
      setProcessingSkillId(null);
    }
  };

  // ----------------------------------------------------
  // ACTIVATE BOOST
  // ----------------------------------------------------

  const handleBoost = async (id, skillName) => {
    const currentActiveBoosts = skills.filter((skill) => {
      const boost = getBoostInfo(skill);

      return (
        boost.status === "ACTIVE" ||
        boost.status === "EXPIRING_SOON"
      );
    }).length;

    if (currentActiveBoosts >= MAX_ACTIVE_BOOSTS) {
      showToast(
        `You can have a maximum of ${MAX_ACTIVE_BOOSTS} active featured listings at the same time.`
      );

      return;
    }

    const confirmed = window.confirm(
      `Boost "${skillName}" for ${BOOST_DURATION_DAYS} days?\n\nDemo payment: ৳${BOOST_PRICE}`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingSkillId(id);

      const response = await boostSkillListing(
        token,
        id
      );

      showToast(
        response.message ||
          `"${skillName}" is now featured for 7 days.`
      );

      await fetchSkills();
    } catch (error) {
      console.error(
        "Failed to activate boost",
        error
      );

      showToast(
        error.message ||
          "Failed to boost skill."
      );
    } finally {
      setProcessingSkillId(null);
    }
  };

  // ----------------------------------------------------
  // RENEW BOOST
  // ----------------------------------------------------

  const handleRenew = async (id, skillName) => {
    const confirmed = window.confirm(
      `Renew the boost for "${skillName}"?\n\nAnother ${BOOST_DURATION_DAYS} days will be added.\nDemo payment: ৳${BOOST_PRICE}`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingSkillId(id);

      const response =
        await renewSkillListingBoost(
          token,
          id
        );

      showToast(
        response.message ||
          `Boost renewed for "${skillName}".`
      );

      await fetchSkills();
    } catch (error) {
      console.error(
        "Failed to renew boost",
        error
      );

      showToast(
        error.message ||
          "Failed to renew boost."
      );
    } finally {
      setProcessingSkillId(null);
    }
  };

  // ----------------------------------------------------
  // MESSAGE
  // ----------------------------------------------------

  function showToast(message) {
    setActionMessage(message);

    window.setTimeout(() => {
      setActionMessage("");
    }, 7000);
  }

  // ----------------------------------------------------
  // BOOST INFORMATION
  // ----------------------------------------------------

  function getBoostInfo(skill) {
    const boost = skill.boost;

    if (
      !boost ||
      boost.status === "inactive" ||
      !boost.expiresAt
    ) {
      return {
        status: "INACTIVE",
        label: "Not Boosted",
        color: "var(--muted)",
        expiresAt: null
      };
    }

    const now = new Date();

    const expiresAt = new Date(
      boost.expiresAt
    );

    const difference =
      expiresAt.getTime() -
      now.getTime();

    if (
      boost.status === "expired" ||
      difference <= 0
    ) {
      return {
        status: "EXPIRED",
        label: "Boost Expired",
        color: "var(--coral)",
        expiresAt
      };
    }

    const totalHours = Math.ceil(
      difference /
        (1000 * 60 * 60)
    );

    const days = Math.floor(
      totalHours / 24
    );

    const hours =
      totalHours % 24;

    if (totalHours <= 24) {
      return {
        status: "EXPIRING_SOON",
        label: `Expiring Soon (${totalHours}h left)`,
        color: "#f59e0b",
        expiresAt
      };
    }

    return {
      status: "ACTIVE",
      label: `${days}d ${hours}h left`,
      color: "#10b981",
      expiresAt
    };
  }

  // ----------------------------------------------------
  // FORMAT DATE
  // ----------------------------------------------------

  function formatDate(date) {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    );
  }

  // ----------------------------------------------------
  // LOADING
  // ----------------------------------------------------

  if (loading) {
    return (
      <div
        className="portfolio-page"
        style={{
          paddingTop: "2rem"
        }}
      >
        <p>Loading skills...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // SKILL GROUPS
  // ----------------------------------------------------

  const teachingSkills = skills.filter(
    (skill) => skill.type === "teach"
  );

  const learningSkills = skills.filter(
    (skill) => skill.type === "learn"
  );

  const boostedCount = teachingSkills.filter(
    (skill) => {
      const boost = getBoostInfo(skill);

      return (
        boost.status === "ACTIVE" ||
        boost.status === "EXPIRING_SOON"
      );
    }
  ).length;

  const boostLimitReached =
    boostedCount >= MAX_ACTIVE_BOOSTS;

  const availableBoostSlots = Math.max(
    0,
    MAX_ACTIVE_BOOSTS - boostedCount
  );

  // ----------------------------------------------------
  // PAGE
  // ----------------------------------------------------

  return (
    <div
      className="portfolio-page"
      style={{
        paddingTop: "2rem"
      }}
    >
      <div
        className="portfolio-header"
        style={{
          marginBottom: "1.5rem"
        }}
      >
        <div>
          <p className="eyebrow">
            Skill Management & Visibility
          </p>

          <h1>My Skills</h1>

          <p>
            Manage your listings, activate 7-day
            visibility boosts, and monitor boost expiry.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: "0.9rem 1.2rem",
            background:
              "rgba(242, 195, 130, 0.15)",
            border:
              "1px solid rgba(242, 195, 130, 0.6)",
            borderRadius: "0.8rem",
            color: "var(--cream)",
            marginBottom: "1.5rem",
            fontWeight: "700"
          }}
        >
          {actionMessage}
        </div>
      )}

      {boostLimitReached && (
        <div
          style={{
            padding: "0.9rem 1.2rem",
            background:
              "rgba(242, 195, 130, 0.10)",
            border:
              "1px solid rgba(242, 195, 130, 0.45)",
            borderRadius: "0.8rem",
            color: "var(--cream)",
            marginBottom: "1.5rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem"
          }}
        >
          <AlertCircle size={18} />

          You are currently using all 3 featured
          listing slots. Renewing an existing boost
          is still allowed.
        </div>
      )}

      <div className="portfolio-layout">
        <div>
          <div className="feed-heading">
            <h2>
              Skills I Can Teach (
              {teachingSkills.length})
            </h2>
          </div>

          {teachingSkills.length === 0 ? (
            <div className="empty-state">
              <span>
                You haven't listed any teaching
                skills yet.
              </span>
            </div>
          ) : (
            teachingSkills.map((skill) => {
              const boost =
                getBoostInfo(skill);

              const isBoostActive =
                boost.status === "ACTIVE" ||
                boost.status ===
                  "EXPIRING_SOON";

              const isExpired =
                boost.status === "EXPIRED";

              const isProcessing =
                processingSkillId ===
                skill._id;

              const disableNewBoost =
                boost.status === "INACTIVE" &&
                boostLimitReached;

              return (
                <div
                  className="portfolio-card"
                  key={skill._id}
                  style={{
                    border: isBoostActive
                      ? "1px solid rgba(242, 195, 130, 0.6)"
                      : "1px solid var(--line)",

                    background: isBoostActive
                      ? "rgba(242, 195, 130, 0.05)"
                      : "rgba(18, 14, 40, 0.7)"
                  }}
                >
                  <div
                    className="portfolio-image-fallback"
                    style={{
                      color: isBoostActive
                        ? "var(--cream)"
                        : "var(--lavender)"
                    }}
                  >
                    <GraduationCap
                      size={44}
                    />
                  </div>

                  <div className="portfolio-card-body">
                    <div className="portfolio-card-top">
                      <h3>
                        {skill.skillName}
                      </h3>

                      {isBoostActive && (
                        <span
                          style={{
                            fontSize:
                              "0.75rem",
                            padding:
                              "0.25rem 0.6rem",
                            borderRadius:
                              "999px",
                            background:
                              "linear-gradient(135deg, var(--cream), var(--coral))",
                            color:
                              "#17102b",
                            fontWeight:
                              "900",
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap:
                              "0.3rem"
                          }}
                        >
                          <Zap
                            size={12}
                            fill="#17102b"
                          />

                          FEATURED
                        </span>
                      )}
                    </div>

                    <div className="tag-row">
                      <span>
                        {skill.proficiency}
                      </span>

                      <span>
                        {skill.sessionDuration} Mins
                      </span>

                      <span>
                        {skill.preferredFormat}
                      </span>
                    </div>

                    {skill.description && (
                      <p>
                        {skill.description}
                      </p>
                    )}

                    <div
                      style={{
                        margin:
                          "0.85rem 0 0.5rem",
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "0.4rem",
                        fontSize:
                          "0.85rem"
                      }}
                    >
                      {boost.status ===
                        "ACTIVE" && (
                        <CheckCircle
                          size={15}
                          color="#10b981"
                        />
                      )}

                      {boost.status ===
                        "EXPIRING_SOON" && (
                        <AlertCircle
                          size={15}
                          color="#f59e0b"
                        />
                      )}

                      {boost.status ===
                        "EXPIRED" && (
                        <Clock
                          size={15}
                          color="var(--coral)"
                        />
                      )}

                      <span
                        style={{
                          color:
                            boost.color,
                          fontWeight:
                            "700"
                        }}
                      >
                        Boost:{" "}
                        {boost.label}
                      </span>
                    </div>

                    {boost.expiresAt &&
                      boost.status !==
                        "INACTIVE" && (
                        <div
                          style={{
                            fontSize:
                              "0.82rem",
                            color:
                              "var(--muted)",
                            marginBottom:
                              "0.35rem"
                          }}
                        >
                          {isExpired
                            ? "Expired:"
                            : "Expires:"}{" "}
                          {formatDate(
                            boost.expiresAt
                          )}
                        </div>
                      )}

                    {boost.status ===
                      "EXPIRING_SOON" && (
                      <div
                        style={{
                          marginTop:
                            "0.75rem",
                          padding:
                            "0.7rem 0.85rem",
                          borderRadius:
                            "0.7rem",
                          background:
                            "rgba(245, 158, 11, 0.12)",
                          border:
                            "1px solid rgba(245, 158, 11, 0.35)",
                          color:
                            "#f59e0b",
                          display: "flex",
                          alignItems:
                            "center",
                          gap: "0.5rem",
                          fontSize:
                            "0.85rem",
                          fontWeight:
                            "700"
                        }}
                      >
                        <AlertCircle
                          size={16}
                        />

                        Your featured listing
                        expires within 24 hours.
                      </div>
                    )}

                    {boost.status ===
                      "EXPIRED" && (
                      <div
                        style={{
                          marginTop:
                            "0.75rem",
                          padding:
                            "0.7rem 0.85rem",
                          borderRadius:
                            "0.7rem",
                          background:
                            "rgba(255, 120, 120, 0.08)",
                          border:
                            "1px solid rgba(255, 120, 120, 0.25)",
                          color:
                            "var(--coral)",
                          display: "flex",
                          alignItems:
                            "center",
                          gap: "0.5rem",
                          fontSize:
                            "0.85rem",
                          fontWeight:
                            "700"
                        }}
                      >
                        <Clock size={16} />

                        This listing's boost has
                        expired. Renew it to become
                        featured again.
                      </div>
                    )}

                    <div
                      className="portfolio-actions"
                      style={{
                        marginTop:
                          "1rem",
                        flexWrap: "wrap",
                        gap: "0.6rem"
                      }}
                    >
                      {boost.status ===
                        "INACTIVE" && (
                        <button
                          className="primary-button small"
                          type="button"
                          disabled={
                            isProcessing ||
                            disableNewBoost
                          }
                          onClick={() =>
                            handleBoost(
                              skill._id,
                              skill.skillName
                            )
                          }
                          title={
                            disableNewBoost
                              ? "Maximum 3 active featured listings reached."
                              : ""
                          }
                          style={
                            disableNewBoost
                              ? {
                                  opacity: 0.55,
                                  cursor:
                                    "not-allowed"
                                }
                              : undefined
                          }
                        >
                          <Zap size={15} />

                          {isProcessing
                            ? "Processing..."
                            : disableNewBoost
                            ? "Boost Limit Reached (3/3)"
                            : `Boost for 7 Days (৳${BOOST_PRICE})`}
                        </button>
                      )}

                      {(isBoostActive ||
                        isExpired) && (
                        <button
                          className="ghost-button small"
                          type="button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            handleRenew(
                              skill._id,
                              skill.skillName
                            )
                          }
                          style={{
                            borderColor:
                              "rgba(242, 195, 130, 0.4)",
                            color:
                              "var(--cream)"
                          }}
                        >
                          <RefreshCw
                            size={15}
                          />

                          {isProcessing
                            ? "Processing..."
                            : `Renew Boost (+7 Days, ৳${BOOST_PRICE})`}
                        </button>
                      )}

                      <button
                        className="ghost-button danger small"
                        type="button"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          handleDelete(
                            skill._id
                          )
                        }
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div
            className="feed-heading"
            style={{
              marginTop: "3rem"
            }}
          >
            <h2>
              Skills I Want To Learn (
              {learningSkills.length})
            </h2>
          </div>

          {learningSkills.length === 0 ? (
            <div className="empty-state">
              <span>
                You haven't listed any learning
                skills yet.
              </span>
            </div>
          ) : (
            learningSkills.map((skill) => (
              <div
                className="portfolio-card"
                key={skill._id}
              >
                <div className="portfolio-image-fallback">
                  <BookOpen size={44} />
                </div>

                <div className="portfolio-card-body">
                  <div className="portfolio-card-top">
                    <h3>
                      {skill.skillName}
                    </h3>
                  </div>

                  <div className="tag-row">
                    <span>
                      {skill.proficiency}
                    </span>

                    <span>
                      {skill.sessionDuration} Mins
                    </span>

                    <span>
                      {skill.preferredFormat}
                    </span>
                  </div>

                  {skill.description && (
                    <p>
                      {skill.description}
                    </p>
                  )}

                  <div
                    className="portfolio-actions"
                    style={{
                      marginTop: "1rem"
                    }}
                  >
                    <button
                      className="ghost-button danger small"
                      type="button"
                      disabled={
                        processingSkillId ===
                        skill._id
                      }
                      onClick={() =>
                        handleDelete(
                          skill._id
                        )
                      }
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            alignContent: "start"
          }}
        >
          <div className="portfolio-stat">
            <Zap size={32} />

            <strong>
              {boostedCount} / {MAX_ACTIVE_BOOSTS}
            </strong>

            <span>
              Active Boost Slots
            </span>
          </div>

          <div className="portfolio-stat">
            <BookOpen size={32} />

            <strong>
              {availableBoostSlots}
            </strong>

            <span>
              Boost Slots Available
            </span>
          </div>

          <div className="portfolio-stat">
            <BookOpen size={32} />

            <strong>
              {skills.length}
            </strong>

            <span>
              Total Skills Tracked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySkills;