import { Dispute } from "../models/Dispute.js";
import { User } from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    File a new dispute against another user
// @route   POST /api/disputes
// @access  Private
export const fileDispute = asyncHandler(async (req, res) => {
  const { reportedUser, relatedSwap, relatedSession, reason, description, evidence } = req.body;

  if (!reportedUser || !reason || !description) {
    return res.status(400).json({
      success: false,
      message: "reportedUser, reason and description are required",
    });
  }
  if (reportedUser === String(req.user.id)) {
    return res.status(400).json({ success: false, message: "You cannot report yourself" });
  }

  const dispute = await Dispute.create({
    reporter: req.user.id,
    reportedUser,
    relatedSwap,
    relatedSession,
    reason,
    description,
    evidence,
  });

  res.status(201).json({ success: true, data: dispute });
});

// @desc    Get disputes filed by or against the logged-in user
// @route   GET /api/disputes/mine
// @access  Private
export const getMyDisputes = asyncHandler(async (req, res) => {
  const disputes = await Dispute.find({
    $or: [{ reporter: req.user.id }, { reportedUser: req.user.id }],
  })
    .populate("reporter reportedUser", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: disputes.length, data: disputes });
});

// @desc    Get all disputes, with optional status filter (admin)
// @route   GET /api/disputes?status=open
// @access  Private/Admin
export const getAllDisputes = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;

  const disputes = await Dispute.find(query)
    .populate("reporter reportedUser", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: disputes.length, data: disputes });
});

// @desc    Get a single dispute
// @route   GET /api/disputes/:id
// @access  Private (reporter, reported user, or admin)
export const getDisputeById = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id).populate("reporter reportedUser", "name email");
  if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });

  const isInvolved =
    String(dispute.reporter._id) === String(req.user.id) ||
    String(dispute.reportedUser._id) === String(req.user.id);
  const isAdmin = req.user.role === "system-admin";

  if (!isInvolved && !isAdmin) {
    return res.status(403).json({ success: false, message: "Not authorized to view this dispute" });
  }

  res.json({ success: true, data: dispute });
});

// @desc    Move a dispute into review and optionally leave an admin note
// @route   PUT /api/disputes/:id/review
// @access  Private/Admin
export const markUnderReview = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });

  dispute.status = "under_review";
  if (req.body.note) {
    dispute.adminNotes.push({ admin: req.user.id, note: req.body.note });
  }
  await dispute.save();

  res.json({ success: true, data: dispute });
});

// @desc    Resolve a dispute with a moderation action
// @route   PUT /api/disputes/:id/resolve
// @access  Private/Admin
// body: { action: 'warning'|'rating_penalty'|'temporary_suspension'|'account_ban'|'no_action', summary }
export const resolveDispute = asyncHandler(async (req, res) => {
  const { action, summary } = req.body;
  const validActions = ["warning", "rating_penalty", "temporary_suspension", "account_ban", "no_action"];

  if (!validActions.includes(action)) {
    return res.status(400).json({ success: false, message: `action must be one of: ${validActions.join(", ")}` });
  }

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });

  dispute.status = "resolved";
  dispute.resolution = { action, summary, resolvedBy: req.user.id, resolvedAt: new Date() };
  await dispute.save();

  // Apply the moderation action to the reported user, using fields that
  // actually exist on User.js today.
  if (action === "rating_penalty") {
    // rating is 0-5 on your schema — nudge it down but never below 0.
    const reportedUser = await User.findById(dispute.reportedUser);
    if (reportedUser) {
      reportedUser.rating = Math.max(0, (reportedUser.rating || 0) - 0.5);
      await reportedUser.save();
    }
  } else if (action === "temporary_suspension" || action === "account_ban") {
    // TODO (needs a schema change, not something this controller can add on
    // its own): User.js currently has no `accountStatus` field, so this is
    // recorded on the Dispute (above) but does NOT yet block the user's
    // login/actions. Ask whoever owns User.js to add:
    //
    //   accountStatus: {
    //     type: String,
    //     enum: ["active", "suspended", "banned"],
    //     default: "active",
    //   }
    //
    // and then this branch can do:
    //   await User.findByIdAndUpdate(dispute.reportedUser, {
    //     accountStatus: action === "account_ban" ? "banned" : "suspended",
    //   });
    // and protect() in auth.js should reject login for suspended/banned users.
  }

  res.json({ success: true, data: dispute });
});

// @desc    Dismiss a dispute with no action taken
// @route   PUT /api/disputes/:id/dismiss
// @access  Private/Admin
export const dismissDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });

  dispute.status = "dismissed";
  dispute.resolution = {
    action: "no_action",
    summary: req.body.summary || "Dismissed after review",
    resolvedBy: req.user.id,
    resolvedAt: new Date(),
  };
  await dispute.save();

  res.json({ success: true, data: dispute });
});
