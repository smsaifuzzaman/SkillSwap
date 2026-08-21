import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { Match } from "../models/Match.js";
import { createNotification } from "../services/reminderService.js";

function getIdString(value) {
  return value?._id?.toString() || value?.toString() || "";
}

function isHalfStarRating(value) {
  return Number.isFinite(value) && value >= 0.5 && value <= 5 && value * 2 === Math.round(value * 2);
}

async function refreshUserAverageRating(userId) {
  if (!userId) return 0;
  const reviewedUserObjectId = new mongoose.Types.ObjectId(userId);

  const [sessionResults, reviewResults, user] = await Promise.all([
    Session.aggregate([
      { $unwind: "$ratings" },
      { $match: { "ratings.reviewedUser": reviewedUserObjectId } },
      { $group: { _id: "$ratings.reviewedUser", avgScore: { $avg: "$ratings.score" }, count: { $sum: 1 } } }
    ]),
    Review.aggregate([
      { $match: { reviewedUser: reviewedUserObjectId } },
      { $group: { _id: "$reviewedUser", avgScore: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]),
    User.findById(reviewedUserObjectId)
  ]);

  let avgRating = 0;
  if (reviewResults.length > 0) {
    avgRating = reviewResults[0].avgScore;
  } else if (sessionResults.length > 0) {
    avgRating = sessionResults[0].avgScore;
  }

  const rounded = Math.round(avgRating * 10) / 10;

  // Compute Trust Score Percentage
  const [reviewsReceived, sessions] = await Promise.all([
    Review.find({ reviewedUser: userId }),
    Session.find({ $or: [{ owner: userId }, { partnerId: userId }] })
  ]);
  
  const reviewsReceivedCount = reviewsReceived.length;
  const completedSessions = sessions.filter((s) => s.status === "Completed").length;
  const cancelledSessions = sessions.filter((s) => s.status === "Cancelled").length;
  const totalDecided = completedSessions + cancelledSessions;

  const ratingScore = reviewsReceivedCount > 0 ? Math.min(100, Math.round((rounded / 5) * 100)) : 80;
  const reliabilityScore = totalDecided > 0 ? Math.round((completedSessions / totalDecided) * 100) : 85;
  const volumeScore = Math.min(100, Math.round((reviewsReceivedCount / 4) * 100));

  let authenticityScore = 50;
  if (user?.bio) authenticityScore += 15;
  if (user?.location) authenticityScore += 15;
  if (user?.profilePhoto) authenticityScore += 10;
  if (user && ((user.teachingSkills?.length > 0) || (user.learningSkills?.length > 0))) {
    authenticityScore += 10;
  }
  authenticityScore = Math.min(100, authenticityScore);

  const overallTrustScore = Math.min(100, Math.max(0, Math.round(ratingScore * 0.4 + reliabilityScore * 0.3 + volumeScore * 0.15 + authenticityScore * 0.15)));

  await User.findByIdAndUpdate(reviewedUserObjectId, {
    rating: rounded,
    trustScore: overallTrustScore
  });

  return rounded;
}

// ----------------------------------------------------
// GET TRUST SUMMARY
// ----------------------------------------------------
export async function getTrustSummary(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const [reviewsReceived, sessions] = await Promise.all([
      Review.find({ reviewedUser: userId }),
      Session.find({
        $or: [{ owner: userId }, { partnerId: userId }]
      })
    ]);

    const reviewsReceivedCount = reviewsReceived.length;

    let averageRating = user.rating || 0;
    if (reviewsReceivedCount > 0) {
      const sum = reviewsReceived.reduce((acc, curr) => acc + (curr.rating || 0), 0);
      averageRating = Math.round((sum / reviewsReceivedCount) * 10) / 10;
    }

    const acceptedSessions = sessions.filter((s) => s.status === "Accepted").length;
    const completedSessions = sessions.filter((s) => s.status === "Completed").length;
    const cancelledSessions = sessions.filter((s) => s.status === "Cancelled").length;
    const confirmedCount = acceptedSessions + completedSessions;
    const totalDecided = completedSessions + cancelledSessions;

    // Trust factors calculation
    const ratingScore = reviewsReceivedCount > 0 ? Math.min(100, Math.round((averageRating / 5) * 100)) : 80;
    const reliabilityScore = totalDecided > 0 ? Math.round((completedSessions / totalDecided) * 100) : 85;
    const volumeScore = Math.min(100, Math.round((reviewsReceivedCount / 4) * 100));

    let authenticityScore = 50;
    if (user.bio) authenticityScore += 15;
    if (user.location) authenticityScore += 15;
    if (user.profilePhoto) authenticityScore += 10;
    if ((user.teachingSkills && user.teachingSkills.length > 0) || (user.learningSkills && user.learningSkills.length > 0)) {
      authenticityScore += 10;
    }
    authenticityScore = Math.min(100, authenticityScore);

    const overallTrustScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          ratingScore * 0.4 +
          reliabilityScore * 0.3 +
          volumeScore * 0.15 +
          authenticityScore * 0.15
        )
      )
    );

    let tier = "New Member";
    if (overallTrustScore >= 90 && reviewsReceivedCount >= 2) {
      tier = "Elite Swapper";
    } else if (overallTrustScore >= 80) {
      tier = "Trusted Peer";
    } else if (overallTrustScore >= 65) {
      tier = "Active Member";
    }

    res.json({
      trustScore: overallTrustScore,
      tier,
      averageRating,
      reviewsReceivedCount,
      confirmedSessionsCount: confirmedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ----------------------------------------------------
// GET REVIEWS AND SESSIONS READY TO REVIEW
// ----------------------------------------------------
export async function getReviews(req, res) {
  try {
    const userId = req.user.id;

    const [reviewsReceived, reviewsGiven, userSessions, userMatches] = await Promise.all([
      Review.find({ reviewedUser: userId })
        .populate("reviewer", "name email profilePhoto")
        .sort({ createdAt: -1 }),
      Review.find({ reviewer: userId })
        .populate("reviewedUser", "name email profilePhoto")
        .sort({ createdAt: -1 }),
      Session.find({
        $or: [{ owner: userId }, { partnerId: userId }],
        status: { $in: ["Accepted", "Completed"] }
      })
        .populate("owner", "name email profilePhoto")
        .populate("partnerId", "name email profilePhoto")
        .sort({ scheduledFor: -1 }),
      Match.find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: "accepted"
      })
        .populate("requester", "name email profilePhoto")
        .populate("recipient", "name email profilePhoto")
        .sort({ updatedAt: -1 })
    ]);

    const eligibleSessions = userSessions.map((session) => {
      const isOwner = getIdString(session.owner) === userId;
      const partner = isOwner ? session.partnerId : session.owner;
      const partnerName = partner?.name || session.partnerName || "Partner";
      const partnerId = getIdString(partner) || (isOwner ? getIdString(session.partnerId) : getIdString(session.owner));
      const userRole = isOwner ? "Learner" : "Teacher";

      const existingReview = reviewsGiven.find(
        (rev) => rev.session && getIdString(rev.session) === getIdString(session._id)
      ) || session.ratings?.find((r) => getIdString(r.reviewer) === userId);

      const receivedPartnerReview = reviewsReceived.find(
        (rev) => rev.session && getIdString(rev.session) === getIdString(session._id)
      ) || session.ratings?.find((r) => getIdString(r.reviewedUser) === userId);

      return {
        sessionId: session._id,
        skillName: session.skillName,
        partnerId,
        partnerName,
        partnerEmail: partner?.email || "",
        partnerPhoto: partner?.profilePhoto || "",
        scheduledFor: session.scheduledFor,
        durationMinutes: session.durationMinutes,
        format: session.format,
        location: session.location,
        status: session.status,
        userRole,
        isTeacher: !isOwner,
        confirmedFromTeachingSide: true,
        existingReview: existingReview
          ? {
              id: existingReview._id,
              rating: existingReview.rating || existingReview.score,
              comment: existingReview.comment || "",
              createdAt: existingReview.createdAt,
              updatedAt: existingReview.updatedAt
            }
          : null,
        receivedPartnerReview: receivedPartnerReview
          ? {
              id: receivedPartnerReview._id,
              rating: receivedPartnerReview.rating || receivedPartnerReview.score,
              comment: receivedPartnerReview.comment || "",
              createdAt: receivedPartnerReview.createdAt
            }
          : null
      };
    });

    const eligibleMatches = userMatches.map((match) => {
      const isRequester = getIdString(match.requester) === userId;
      const partner = isRequester ? match.recipient : match.requester;
      const partnerName = partner?.name || "Partner";
      const partnerId = getIdString(partner);

      const existingReview = reviewsGiven.find(
        (rev) => !rev.session && getIdString(rev.reviewedUser) === partnerId
      );

      const receivedPartnerReview = reviewsReceived.find(
        (rev) => !rev.session && getIdString(rev.reviewer) === partnerId
      );

      return {
        sessionId: `match-${match._id}`, // Fake sessionId so frontend doesn't crash
        isMatch: true,
        skillName: "General Skill Swap",
        partnerId,
        partnerName,
        partnerEmail: partner?.email || "",
        partnerPhoto: partner?.profilePhoto || "",
        scheduledFor: match.updatedAt,
        durationMinutes: 0,
        format: "Online",
        location: "",
        status: "Completed", // Treat accepted matches as completed so they can be reviewed
        userRole: "Peer",
        isTeacher: false,
        confirmedFromTeachingSide: true,
        existingReview: existingReview
          ? {
              id: existingReview._id,
              rating: existingReview.rating,
              comment: existingReview.comment || "",
              createdAt: existingReview.createdAt,
              updatedAt: existingReview.updatedAt
            }
          : null,
        receivedPartnerReview: receivedPartnerReview
          ? {
              id: receivedPartnerReview._id,
              rating: receivedPartnerReview.rating,
              comment: receivedPartnerReview.comment || "",
              createdAt: receivedPartnerReview.createdAt
            }
          : null
      };
    });

    res.json({
      reviewsReceived,
      reviewsGiven,
      eligibleSessions: [...eligibleMatches, ...eligibleSessions]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ----------------------------------------------------
// CREATE OR UPDATE REVIEW
// ----------------------------------------------------
export async function createOrUpdateReview(req, res) {
  try {
    const { sessionId, reviewedUserId, rating, comment, skillName } = req.body;
    const score = Number(rating);

    if (!isHalfStarRating(score)) {
      return res.status(400).json({
        message: "Rating must be between 0.5 and 5 in half-star increments."
      });
    }

    let session = null;
    let targetUserId = reviewedUserId;
    let targetSkill = skillName || "Skill Swap";
    let role = "Peer";

    const isMatchReview = sessionId && sessionId.toString().startsWith("match-");
    const actualSessionId = isMatchReview ? null : sessionId;

    if (actualSessionId) {
      session = await Session.findOne({
        _id: actualSessionId,
        $or: [{ owner: req.user.id }, { partnerId: req.user.id }]
      });

      if (!session) {
        return res.status(404).json({ message: "Associated session not found." });
      }

      if (!["Accepted", "Completed", "Scheduled"].includes(session.status)) {
        return res.status(400).json({
          message: "You can only review sessions that are confirmed or completed."
        });
      }

      const isOwner = getIdString(session.owner) === req.user.id;
      targetUserId = isOwner ? getIdString(session.partnerId) : getIdString(session.owner);
      targetSkill = session.skillName;
      role = isOwner ? "Learner" : "Teacher";

      if (!targetUserId) {
        return res.status(400).json({
          message: "Session does not have a registered partner to review."
        });
      }

      // Also update Session.ratings array
      const now = new Date();
      const existingSessionRating = session.ratings.find(
        (r) => getIdString(r.reviewer) === req.user.id
      );

      if (existingSessionRating) {
        existingSessionRating.score = score;
        existingSessionRating.comment = comment ? comment.trim() : "";
        existingSessionRating.reviewedUser = targetUserId;
        existingSessionRating.updatedAt = now;
      } else {
        session.ratings.push({
          reviewer: req.user.id,
          reviewedUser: targetUserId,
          score,
          comment: comment ? comment.trim() : "",
          createdAt: now,
          updatedAt: now
        });
      }

      await session.save();
    }

    if (!targetUserId) {
      return res.status(400).json({ message: "Reviewed user ID is required." });
    }

    const now = new Date();
    const cleanComment = comment ? comment.trim() : "";

    const review = await Review.findOneAndUpdate(
      {
        reviewer: req.user.id,
        ...(actualSessionId ? { session: actualSessionId } : { reviewedUser: targetUserId })
      },
      {
        session: actualSessionId || null,
        reviewer: req.user.id,
        reviewedUser: targetUserId,
        skillName: targetSkill,
        rating: score,
        comment: cleanComment,
        role,
        updatedAt: now
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate("reviewer", "name email profilePhoto")
      .populate("reviewedUser", "name email profilePhoto");

    await refreshUserAverageRating(targetUserId);

    await createNotification(
      targetUserId,
      "trust_score",
      "New Review Received",
      `${req.user.name || "A peer"} just left a ${score}-star review for your session.`,
      review._id
    );

    res.status(201).json({
      message: "Review and rating submitted successfully.",
      review
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// ----------------------------------------------------
// DELETE REVIEW
// ----------------------------------------------------
export async function deleteReview(req, res) {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      reviewer: req.user.id
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found or unauthorized." });
    }

    if (review.session) {
      await Session.findByIdAndUpdate(review.session, {
        $pull: { ratings: { reviewer: req.user.id } }
      });
    }

    await refreshUserAverageRating(review.reviewedUser);

    res.json({ message: "Review deleted successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
