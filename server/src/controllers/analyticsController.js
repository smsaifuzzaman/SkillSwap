import mongoose from "mongoose";
import { SwapRequest } from "../models/SwapRequest.js";
import { Session } from "../models/Session.js";
import asyncHandler from "../utils/asyncHandler.js";

// Reads across SwapRequest and Session — never writes to either.
// Field name is `skillName` throughout, matching both SwapRequest's
// skillSnapshot and Session's own skillName field.

// @desc    Personal learning analytics for the logged-in user
// @route   GET /api/analytics/me
// @access  Private
export const getMyAnalytics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const [swapStats, skillBreakdown, sessionStats] = await Promise.all([
    SwapRequest.aggregate([
      { $match: { $or: [{ requester: userId }, { recipient: userId }] } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    SwapRequest.aggregate([
      { $match: { $or: [{ requester: userId }, { recipient: userId }], status: "accepted" } },
      {
        $group: {
          _id: null,
          skillsTaught: { $addToSet: "$offeredSkill.skillName" },
          skillsLearned: { $addToSet: "$requestedSkill.skillName" },
        },
      },
    ]),
    // Session.status uses capitalized strings ("Completed", not "completed").
    Session.aggregate([
      { $match: { $or: [{ owner: userId }, { partnerId: userId }], status: "Completed" } },
      {
        $group: {
          _id: null,
          totalCompletedSessions: { $sum: 1 },
          totalMinutesInSessions: { $sum: "$durationMinutes" },
        },
      },
    ]),
  ]);

  const statusCounts = swapStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
  const breakdown = skillBreakdown[0] || { skillsTaught: [], skillsLearned: [] };
  const sessions = sessionStats[0] || { totalCompletedSessions: 0, totalMinutesInSessions: 0 };

  res.json({
    success: true,
    data: {
      totalSwapsRequested: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      swapsByStatus: statusCounts,
      completedSwaps: statusCounts.accepted || 0,
      skillsTaught: breakdown.skillsTaught,
      skillsLearned: breakdown.skillsLearned,
      totalCompletedSessions: sessions.totalCompletedSessions,
      totalMinutesInSessions: sessions.totalMinutesInSessions,
    },
  });
});

// @desc    Most in-demand skills platform-wide
// @route   GET /api/analytics/popular-skills?limit=10
// @access  Private
export const getPopularSkills = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

  const [popular, sessionSkills] = await Promise.all([
    SwapRequest.aggregate([
      {
        $facet: {
          taught: [{ $group: { _id: "$offeredSkill.skillName", count: { $sum: 1 } } }],
          wanted: [{ $group: { _id: "$requestedSkill.skillName", count: { $sum: 1 } } }],
        },
      },
    ]),
    Session.aggregate([{ $group: { _id: "$skillName", count: { $sum: 1 } } }]),
  ]);

  const merge = (arr) =>
    arr.reduce((acc, { _id, count }) => {
      if (!_id) return acc;
      acc[_id] = (acc[_id] || 0) + count;
      return acc;
    }, {});

  const combined = merge([...(popular[0]?.taught || []), ...(popular[0]?.wanted || []), ...sessionSkills]);

  const ranked = Object.entries(combined)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  res.json({ success: true, count: ranked.length, data: ranked });
});

// @desc    Platform engagement trend — swaps created per day over a window
// @route   GET /api/analytics/engagement?days=30
// @access  Private/Admin
export const getEngagementTrends = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 180);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const trend = await SwapRequest.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        swapsCreated: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, days, data: trend });
});

// @desc    Simple rule-based skill recommendations for the logged-in user
// @route   GET /api/analytics/recommendations
// @access  Private
export const getRecommendations = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const mySwaps = await SwapRequest.find({
    $or: [{ requester: userId }, { recipient: userId }],
  }).select("offeredSkill requestedSkill");

  const alreadyInvolved = new Set(
    mySwaps.flatMap((s) => [s.offeredSkill?.skillName, s.requestedSkill?.skillName]).filter(Boolean)
  );

  const popular = await SwapRequest.aggregate([
    { $group: { _id: "$requestedSkill.skillName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  const recommendations = popular
    .filter((p) => p._id && !alreadyInvolved.has(p._id))
    .slice(0, 8)
    .map((p) => ({ skill: p._id, demandScore: p.count }));

  res.json({ success: true, count: recommendations.length, data: recommendations });
});
