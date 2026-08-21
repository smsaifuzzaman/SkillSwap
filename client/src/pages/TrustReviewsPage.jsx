import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  HeartHandshake,
  MapPin,
  MessageSquare,
  PenLine,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  User,
  UserCheck,
  Video
} from "lucide-react";
import {
  deleteReview,
  getReviews,
  getTrustSummary,
  submitReview
} from "../api/reviewApi.js";

const QUICK_TAGS = [
  "🌟 Outstanding Teacher",
  "💬 Clear Communicator",
  "⏰ Punctual & Prepared",
  "🤝 Patient & Supportive",
  "💡 Highly Knowledgeable",
  "🎯 Great Learning Attitude",
  "🚀 Highly Recommended"
];

const RATING_DESCRIPTIONS = {
  5: "5.0 - Outstanding exchange! Exceeded expectations.",
  4.5: "4.5 - Excellent session. Very helpful and knowledgeable.",
  4: "4.0 - Great session. Clear communication and good pacing.",
  3.5: "3.5 - Good exchange with some minor room for improvement.",
  3: "3.0 - Average session. Met the basic requirements.",
  2.5: "2.5 - Below expectations in preparation or delivery.",
  2: "2.0 - Difficulties during the session.",
  1.5: "1.5 - Poor experience.",
  1: "1.0 - Unsatisfactory session.",
  0.5: "0.5 - Very poor exchange."
};

function formatDateTime(value) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

function StarRatingDisplay({ score = 0, size = 16, showNumber = false }) {
  const numScore = Number(score) || 0;
  return (
    <div className="star-rating-display" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = numScore >= starIndex;
        const isHalf = !isFilled && numScore >= starIndex - 0.5;

        return (
          <Star
            key={starIndex}
            size={size}
            className={`star-icon ${isFilled ? "filled" : isHalf ? "half-filled" : "empty"}`}
            style={{
              color: isFilled || isHalf ? "var(--cream, #f2c382)" : "rgba(255,255,255,0.2)",
              fill: isFilled
                ? "var(--cream, #f2c382)"
                : isHalf
                ? "url(#half-grad)"
                : "none"
            }}
          />
        );
      })}
      {showNumber ? (
        <strong style={{ marginLeft: "0.35rem", fontSize: "0.95rem", color: "var(--cream)" }}>
          {numScore.toFixed(1)}
        </strong>
      ) : null}
    </div>
  );
}

function StarRatingInput({ value, onChange, disabled }) {
  const [hoverRating, setHoverRating] = useState(0);
  const currentRating = hoverRating || value || 0;

  return (
    <div className="star-rating-picker">
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = currentRating >= starIndex;
          const isHalf = !isFilled && currentRating >= starIndex - 0.5;

          return (
            <button
              type="button"
              key={starIndex}
              className="star-button"
              disabled={disabled}
              onMouseEnter={() => setHoverRating(starIndex)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => onChange(starIndex)}
              aria-label={`Rate ${starIndex} stars`}
            >
              <Star
                size={26}
                style={{
                  color: isFilled || isHalf ? "var(--cream, #f2c382)" : "rgba(255, 255, 255, 0.25)",
                  fill: isFilled ? "var(--cream, #f2c382)" : "none",
                  transition: "transform 150ms ease, color 150ms ease"
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="quick-score-chips">
        {[5.0, 4.5, 4.0, 3.5, 3.0].map((score) => (
          <button
            type="button"
            key={score}
            className={`quick-score-chip ${value === score ? "active" : ""}`}
            disabled={disabled}
            onClick={() => onChange(score)}
          >
            {score.toFixed(1)} ★
          </button>
        ))}
      </div>

      <span className="rating-desc-text">
        {RATING_DESCRIPTIONS[value] || (value ? `${value.toFixed(1)} stars selected` : "Select a rating")}
      </span>
    </div>
  );
}

function TrustReviewsPage({ user, token }) {
  const [summary, setSummary] = useState(null);
  const [reviewsData, setReviewsData] = useState({
    reviewsReceived: [],
    reviewsGiven: [],
    eligibleSessions: []
  });
  const [activeTab, setActiveTab] = useState("sessions"); // "sessions" | "received" | "given"
  const [sessionFilter, setSessionFilter] = useState("all"); // "all" | "pending" | "reviewed"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Review form states indexed by session ID
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [reviewForms, setReviewForms] = useState({});
  const [submittingSessionId, setSubmittingSessionId] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!token) return;

      try {
        setLoading(true);
        setError("");

        const [summaryRes, reviewsRes] = await Promise.all([
          getTrustSummary(token),
          getReviews(token)
        ]);

        setSummary(summaryRes);
        setReviewsData(reviewsRes);

        // Prepopulate form states for eligible sessions
        const initialForms = {};
        (reviewsRes.eligibleSessions || []).forEach((sess) => {
          initialForms[sess.sessionId] = {
            rating: sess.existingReview?.rating || 5,
            comment: sess.existingReview?.comment || ""
          };
        });
        setReviewForms(initialForms);
      } catch (err) {
        setError(err.message || "Failed to load trust reviews data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  const pendingReviewCount = useMemo(() => {
    return (reviewsData.eligibleSessions || []).filter((s) => !s.existingReview).length;
  }, [reviewsData.eligibleSessions]);

  const filteredSessions = useMemo(() => {
    const sessions = reviewsData.eligibleSessions || [];
    if (sessionFilter === "pending") {
      return sessions.filter((s) => !s.existingReview);
    }
    if (sessionFilter === "reviewed") {
      return sessions.filter((s) => Boolean(s.existingReview));
    }
    return sessions;
  }, [reviewsData.eligibleSessions, sessionFilter]);

  function handleFormChange(sessionId, field, value) {
    setReviewForms((prev) => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || { rating: 5, comment: "" }),
        [field]: value
      }
    }));
  }

  function handleAddQuickTag(sessionId, tag) {
    const currentComment = reviewForms[sessionId]?.comment || "";
    const cleanTag = tag.trim();
    const updated = currentComment
      ? `${currentComment} ${cleanTag}`
      : cleanTag;
    handleFormChange(sessionId, "comment", updated);
  }

  async function handleReviewSubmit(session) {
    const formData = reviewForms[session.sessionId] || { rating: 5, comment: "" };

    if (!formData.rating) {
      setError("Please select a star rating.");
      return;
    }

    try {
      setSubmittingSessionId(session.sessionId);
      setError("");
      setSuccess("");

      const res = await submitReview(token, {
        sessionId: session.sessionId,
        reviewedUserId: session.partnerId,
        skillName: session.skillName,
        rating: Number(formData.rating),
        comment: formData.comment || ""
      });

      // Reload fresh data
      const [summaryRes, reviewsRes] = await Promise.all([
        getTrustSummary(token),
        getReviews(token)
      ]);

      setSummary(summaryRes);
      setReviewsData(reviewsRes);
      setEditingSessionId(null);
      setSuccess(res.message || "Review submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingSessionId(null);
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteReview(token, reviewId);

      const [summaryRes, reviewsRes] = await Promise.all([
        getTrustSummary(token),
        getReviews(token)
      ]);

      setSummary(summaryRes);
      setReviewsData(reviewsRes);
      setSuccess("Review removed.");
    } catch (err) {
      setError(err.message || "Failed to delete review.");
    }
  }

  if (loading) {
    return (
      <div className="portfolio-page trust-reviews-page">
        <p>Loading trust score & reviews...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-page trust-reviews-page">
      {/* Header Banner */}
      <div className="portfolio-header trust-header">
        <div>
          <p className="eyebrow">Reputation & Peer Reviews</p>
          <h1>Trust Score & Reviews</h1>
          <p>
            Build reputation through confirmed skill exchanges. When a session is confirmed
            from the teaching side, rate your partner and write reviews to grow community trust.
          </p>
        </div>

        <div className="portfolio-stat trust-hero-stat">
          <ShieldCheck size={32} />
          <strong>{summary?.trustScore ?? 85}%</strong>
          <span className="trust-badge-pill">{summary?.tier || "Trusted Member"}</span>
        </div>
      </div>

      {error ? <p className="form-error trust-alert">{error}</p> : null}
      {success ? <p className="form-note trust-alert">{success}</p> : null}

      {/* Summary Stat Grid */}
      <div className="trust-summary-grid">
        <div className="trust-metric-card">
          <div className="metric-icon-wrap">
            <Star size={24} />
          </div>
          <div>
            <strong>{(summary?.averageRating || 0).toFixed(1)} / 5.0</strong>
            <span>Community Rating</span>
          </div>
        </div>

        <div className="trust-metric-card">
          <div className="metric-icon-wrap">
            <MessageSquare size={24} />
          </div>
          <div>
            <strong>{summary?.reviewsReceivedCount || 0}</strong>
            <span>Reviews Received</span>
          </div>
        </div>

        <div className="trust-metric-card">
          <div className="metric-icon-wrap">
            <HeartHandshake size={24} />
          </div>
          <div>
            <strong>{summary?.confirmedSessionsCount || 0}</strong>
            <span>Confirmed Swaps</span>
          </div>
        </div>

        <div className="trust-metric-card highlight">
          <div className="metric-icon-wrap">
            <PenLine size={24} />
          </div>
          <div>
            <strong>{pendingReviewCount}</strong>
            <span>Pending Your Review</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="trust-tab-nav">
        <button
          type="button"
          className={`trust-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
          <PenLine size={17} />
          Rate Confirmed Sessions
          {pendingReviewCount > 0 ? (
            <span className="tab-counter-badge">{pendingReviewCount}</span>
          ) : null}
        </button>

        <button
          type="button"
          className={`trust-tab-btn ${activeTab === "received" ? "active" : ""}`}
          onClick={() => setActiveTab("received")}
        >
          <Star size={17} />
          Reviews Received ({reviewsData.reviewsReceived.length})
        </button>

        <button
          type="button"
          className={`trust-tab-btn ${activeTab === "given" ? "active" : ""}`}
          onClick={() => setActiveTab("given")}
        >
          <UserCheck size={17} />
          Reviews Given ({reviewsData.reviewsGiven.length})
        </button>

      </div>

      {/* TAB 1: RATE CONFIRMED SESSIONS */}
      {activeTab === "sessions" ? (
        <section className="trust-section">
          <div className="trust-section-header">
            <div>
              <h2>Confirmed Swaps Ready for Review</h2>
              <p>
                When a scheduling is confirmed from the teaching side (accepted or completed),
                both partners can rate and write peer reviews here.
              </p>
            </div>

            <div className="trust-filter-group">
              <button
                type="button"
                className={`filter-chip ${sessionFilter === "all" ? "active" : ""}`}
                onClick={() => setSessionFilter("all")}
              >
                All ({reviewsData.eligibleSessions.length})
              </button>
              <button
                type="button"
                className={`filter-chip ${sessionFilter === "pending" ? "active" : ""}`}
                onClick={() => setSessionFilter("pending")}
              >
                Pending Review ({pendingReviewCount})
              </button>
              <button
                type="button"
                className={`filter-chip ${sessionFilter === "reviewed" ? "active" : ""}`}
                onClick={() => setSessionFilter("reviewed")}
              >
                Reviewed ({reviewsData.eligibleSessions.length - pendingReviewCount})
              </button>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="empty-state trust-empty">
              <Shield size={34} />
              <strong>No confirmed sessions in this view</strong>
              <span>
                Once a session request is accepted by the teacher, it will appear here for you to
                leave star ratings and written reviews.
              </span>
            </div>
          ) : (
            <div className="sessions-review-grid">
              {filteredSessions.map((session) => {
                const isEditing =
                  editingSessionId === session.sessionId || !session.existingReview;
                const formState = reviewForms[session.sessionId] || {
                  rating: 5,
                  comment: ""
                };
                const isSubmitting = submittingSessionId === session.sessionId;

                return (
                  <article className="session-review-card" key={session.sessionId}>
                    <div className="session-review-card-header">
                      <div>
                        <div className="session-badges-row">
                          <span className="match-label">
                            <CheckCircle2 size={13} /> Confirmed by Teacher
                          </span>
                          <span className="role-badge">
                            {session.userRole === "Teacher"
                              ? "🎓 You taught this session"
                              : "📖 You learned this skill"}
                          </span>
                          <span className={`status-pill ${session.status === "Completed" ? "accepted" : ""}`}>
                            {session.status}
                          </span>
                        </div>

                        <h3>{session.skillName}</h3>
                      </div>

                      <div className="partner-avatar-wrap">
                        <div className="partner-avatar-initials">
                          {session.partnerName
                            ?.split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")
                            .toUpperCase() || "SS"}
                        </div>
                        <div>
                          <strong>{session.partnerName}</strong>
                          <small>Swap Partner</small>
                        </div>
                      </div>
                    </div>

                    <div className="session-meta-grid">
                      <span>
                        <Clock size={16} />
                        {formatDateTime(session.scheduledFor)} ({session.durationMinutes} mins)
                      </span>
                      <span>
                        <Video size={16} />
                        {session.format || "Online"}
                      </span>
                      {session.location ? (
                        <span>
                          <MapPin size={16} />
                          {session.location}
                        </span>
                      ) : null}
                    </div>

                    {/* Existing Submitted Review Display */}
                    {!isEditing && session.existingReview ? (
                      <div className="existing-review-box">
                        <div className="existing-review-top">
                          <div>
                            <span className="match-label">Your Submitted Review</span>
                            <StarRatingDisplay score={session.existingReview.rating} showNumber={true} />
                          </div>

                          <button
                            type="button"
                            className="ghost-button small"
                            onClick={() => setEditingSessionId(session.sessionId)}
                          >
                            <PenLine size={15} /> Edit Review
                          </button>
                        </div>

                        {session.existingReview.comment ? (
                          <p className="review-quote-text">
                            "{session.existingReview.comment}"
                          </p>
                        ) : (
                          <p className="review-quote-placeholder">
                            No written comments attached yet.
                          </p>
                        )}

                        <small className="review-date-foot">
                          Reviewed on {formatDate(session.existingReview.updatedAt || session.existingReview.createdAt)}
                        </small>
                      </div>
                    ) : (
                      /* Interactive Rating & Review Form */
                      <div className="review-form-panel">
                        <div className="review-form-title">
                          <Sparkles size={18} />
                          <strong>
                            {session.existingReview
                              ? `Update your review for ${session.partnerName}`
                              : `Rate & Review ${session.partnerName}`}
                          </strong>
                        </div>

                        {/* Star Picker */}
                        <div className="form-field-group">
                          <label className="field-label">
                            Star Rating <span className="req">*</span>
                          </label>
                          <StarRatingInput
                            value={formState.rating}
                            onChange={(val) => handleFormChange(session.sessionId, "rating", val)}
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Written Review Textarea */}
                        <div className="form-field-group">
                          <div className="label-with-counter">
                            <label className="field-label">
                              Written Review & Feedback
                            </label>
                            <small>{(formState.comment || "").length} / 1000</small>
                          </div>

                          <textarea
                            className="review-textarea"
                            rows="3"
                            placeholder={`Share your experience with ${session.partnerName} (e.g., communication, punctuality, teaching clarity, prep work)...`}
                            value={formState.comment}
                            maxLength={1000}
                            disabled={isSubmitting}
                            onChange={(e) =>
                              handleFormChange(session.sessionId, "comment", e.target.value)
                            }
                          />
                        </div>

                        {/* Quick Tags Suggestions */}
                        <div className="quick-tags-container">
                          <span>Quick suggestions:</span>
                          <div className="quick-tags-list">
                            {QUICK_TAGS.map((tag) => (
                              <button
                                type="button"
                                key={tag}
                                className="tag-chip-btn"
                                disabled={isSubmitting}
                                onClick={() => handleAddQuickTag(session.sessionId, tag)}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="review-form-actions">
                          <button
                            type="button"
                            className="primary-button"
                            disabled={isSubmitting}
                            onClick={() => handleReviewSubmit(session)}
                          >
                            <PenLine size={16} />
                            {isSubmitting
                              ? "Saving review..."
                              : session.existingReview
                              ? "Update Review"
                              : "Submit Review"}
                          </button>

                          {session.existingReview ? (
                            <button
                              type="button"
                              className="ghost-button"
                              disabled={isSubmitting}
                              onClick={() => setEditingSessionId(null)}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* Received partner review preview if available */}
                    {session.receivedPartnerReview ? (
                      <div className="partner-recip-review">
                        <div className="recip-review-header">
                          <User size={15} />
                          <span>{session.partnerName}'s review for you:</span>
                          <StarRatingDisplay score={session.receivedPartnerReview.rating} showNumber={true} />
                        </div>
                        {session.receivedPartnerReview.comment ? (
                          <p>"{session.receivedPartnerReview.comment}"</p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* TAB 2: REVIEWS RECEIVED */}
      {activeTab === "received" ? (
        <section className="trust-section">
          <div className="trust-section-header">
            <div>
              <h2>Peer Reviews Received</h2>
              <p>Ratings and written reviews submitted by your SkillSwap partners.</p>
            </div>
            <div className="overall-rating-badge">
              <Star size={20} />
              <strong>{(summary?.averageRating || 0).toFixed(1)}</strong>
              <span>({reviewsData.reviewsReceived.length} reviews)</span>
            </div>
          </div>

          {reviewsData.reviewsReceived.length === 0 ? (
            <div className="empty-state trust-empty">
              <MessageSquare size={34} />
              <strong>No reviews received yet</strong>
              <span>
                Complete confirmed swaps with peers to collect star ratings and reviews.
              </span>
            </div>
          ) : (
            <div className="public-reviews-grid">
              {reviewsData.reviewsReceived.map((review) => (
                <article className="public-review-card" key={review._id}>
                  <div className="public-review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.reviewer?.name
                          ?.split(" ")
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase() || "SS"}
                      </div>
                      <div>
                        <strong>{review.reviewer?.name || "SkillSwap Peer"}</strong>
                        <span className="review-role-tag">
                          {review.role === "Teacher" ? "Taught you" : "Learned from you"} • {review.skillName}
                        </span>
                      </div>
                    </div>

                    <div className="review-rating-block">
                      <StarRatingDisplay score={review.rating} showNumber={true} />
                      <small>{formatDate(review.createdAt)}</small>
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="public-review-comment">"{review.comment}"</p>
                  ) : (
                    <p className="public-review-empty-comment">Rated with {review.rating} stars.</p>
                  )}

                  <div className="review-card-foot">
                    <span className="verified-swap-badge">
                      <ShieldCheck size={14} /> Verified SkillSwap Exchange
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* TAB 3: REVIEWS GIVEN */}
      {activeTab === "given" ? (
        <section className="trust-section">
          <div className="trust-section-header">
            <div>
              <h2>Reviews You've Given</h2>
              <p>Feedback and star ratings you left for your swap partners.</p>
            </div>
          </div>

          {reviewsData.reviewsGiven.length === 0 ? (
            <div className="empty-state trust-empty">
              <ThumbsUp size={34} />
              <strong>No reviews given yet</strong>
              <span>
                Go to the "Rate Confirmed Sessions" tab to review your swap partners!
              </span>
            </div>
          ) : (
            <div className="public-reviews-grid">
              {reviewsData.reviewsGiven.map((review) => (
                <article className="public-review-card" key={review._id}>
                  <div className="public-review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.reviewedUser?.name
                          ?.split(" ")
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase() || "SS"}
                      </div>
                      <div>
                        <strong>{review.reviewedUser?.name || "Partner"}</strong>
                        <span className="review-role-tag">
                          {review.skillName} • {review.role || "Peer"}
                        </span>
                      </div>
                    </div>

                    <div className="review-rating-block">
                      <StarRatingDisplay score={review.rating} showNumber={true} />
                      <small>{formatDate(review.createdAt)}</small>
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="public-review-comment">"{review.comment}"</p>
                  ) : (
                    <p className="public-review-empty-comment">Rated {review.rating} stars.</p>
                  )}

                  <div className="review-card-foot actions-foot">
                    <span className="verified-swap-badge">
                      <ShieldCheck size={14} /> Submitted Review
                    </span>

                    <button
                      type="button"
                      className="ghost-button danger small"
                      onClick={() => handleDeleteReview(review._id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

    </div>
  );
}

export default TrustReviewsPage;
