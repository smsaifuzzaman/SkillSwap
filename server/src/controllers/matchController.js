import { Match } from "../models/Match.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

// @desc    Send a match request
// @route   POST /api/matches/:userId
// @access  Private
export async function requestMatch(req, res, next) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot match with yourself" });
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { requester: currentUserId, recipient: userId },
        { requester: userId, recipient: currentUserId }
      ]
    });

    if (existingMatch) {
      return res.status(400).json({ message: `Match request already exists with status: ${existingMatch.status}` });
    }

    const match = await Match.create({
      requester: currentUserId,
      recipient: userId,
      status: "pending"
    });

    // Notify the recipient
    await Notification.create({
      recipient: userId,
      type: "match",
      title: "New Match Request!",
      message: `${req.user.name} wants to swap skills with you!`,
      relatedEntityId: match._id
    });

    res.status(201).json(match);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Match already requested." });
    }
    next(error);
  }
}

// @desc    Respond to a match request
// @route   PUT /api/matches/:matchId/respond
// @access  Private
export async function respondToMatch(req, res, next) {
  try {
    const { matchId } = req.params;
    const { action } = req.body; // "accept" or "reject"
    const currentUserId = req.user._id;

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'accept' or 'reject'." });
    }

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ message: "Match request not found" });
    }

    if (match.recipient.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Not authorized to respond to this match" });
    }

    if (match.status !== "pending") {
      return res.status(400).json({ message: `Match is already ${match.status}` });
    }

    match.status = action === "accept" ? "accepted" : "rejected";
    await match.save();

    if (action === "accept") {
      // Notify the requester
      await Notification.create({
        recipient: match.requester,
        type: "match",
        title: "Match Accepted!",
        message: `${req.user.name} has accepted your match request!`,
        relatedEntityId: currentUserId
      });
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
}

// @desc    Get all matches for current user
// @route   GET /api/matches
// @access  Private
export async function getMatches(req, res, next) {
  try {
    const currentUserId = req.user._id;

    const matches = await Match.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }]
    })
      .populate("requester", "name profilePhoto location")
      .populate("recipient", "name profilePhoto location")
      .sort({ updatedAt: -1 });

    res.json(matches);
  } catch (error) {
    next(error);
  }
}
