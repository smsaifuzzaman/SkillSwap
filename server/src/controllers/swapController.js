import { SwapRequest } from "../models/SwapRequest.js";
import asyncHandler from "../utils/asyncHandler.js";

// req.user is the full Mongoose User document (confirmed from auth.js).
// req.user.id (virtual string) and req.user.role both work directly.

// @desc    Create a new swap request
// @route   POST /api/swaps
// @access  Private
export const createSwapRequest = asyncHandler(async (req, res) => {
  const { recipient, offeredSkill, requestedSkill, message, proposedSchedule } = req.body;

  if (!recipient || !offeredSkill?.skillName || !requestedSkill?.skillName) {
    return res.status(400).json({
      success: false,
      message: "recipient, offeredSkill.skillName and requestedSkill.skillName are required",
    });
  }

  if (recipient === String(req.user.id)) {
    return res.status(400).json({ success: false, message: "You cannot send a swap request to yourself" });
  }

  const swap = await SwapRequest.create({
    requester: req.user.id,
    recipient,
    offeredSkill,
    requestedSkill,
    message,
    proposedSchedule,
    history: [{ action: "created", by: req.user.id, note: message }],
  });

  const populated = await swap.populate([
    { path: "requester", select: "name email" },
    { path: "recipient", select: "name email" },
  ]);

  res.status(201).json({ success: true, data: populated });
});

// @desc    Get all swap requests involving the logged-in user (sent + received)
// @route   GET /api/swaps?status=pending&direction=received
// @access  Private
export const getMySwapRequests = asyncHandler(async (req, res) => {
  const { status, direction } = req.query;

  const query = {};
  if (status) query.status = status;

  if (direction === "sent") {
    query.requester = req.user.id;
  } else if (direction === "received") {
    query.recipient = req.user.id;
  } else {
    query.$or = [{ requester: req.user.id }, { recipient: req.user.id }];
  }

  const swaps = await SwapRequest.find(query)
    .populate("requester", "name email")
    .populate("recipient", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: swaps.length, data: swaps });
});

// @desc    Get a single swap request
// @route   GET /api/swaps/:id
// @access  Private
export const getSwapRequestById = asyncHandler(async (req, res) => {
  const swap = await SwapRequest.findById(req.params.id)
    .populate("requester", "name email")
    .populate("recipient", "name email");

  if (!swap) {
    return res.status(404).json({ success: false, message: "Swap request not found" });
  }

  assertParticipant(swap, req.user.id);
  res.json({ success: true, data: swap });
});

// @desc    Accept a pending (or countered) swap request
// @route   PUT /api/swaps/:id/accept
// @access  Private (must be whoever's turn it is to respond)
export const acceptSwapRequest = asyncHandler(async (req, res) => {
  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ success: false, message: "Swap request not found" });

  if (!["pending", "countered"].includes(swap.status)) {
    return res.status(400).json({ success: false, message: `Cannot accept a swap with status "${swap.status}"` });
  }

  assertTurnToRespond(swap, req.user.id);

  if (swap.status === "countered") {
    swap.offeredSkill = swap.counterOffer.offeredSkill || swap.offeredSkill;
    swap.requestedSkill = swap.counterOffer.requestedSkill || swap.requestedSkill;
    swap.proposedSchedule = swap.counterOffer.proposedSchedule || swap.proposedSchedule;
    swap.counterOffer = undefined;
  }

  swap.status = "accepted";
  swap.history.push({ action: "accepted", by: req.user.id });
  await swap.save();

  // Integration point: Module 2's Session Scheduling controller should listen
  // for this (or you can call it directly here) to spin up a Session doc.
  // Session.js requires owner, skillName, partnerName, scheduledFor, and
  // reminderEmail — none of which a SwapRequest carries on its own, so
  // whoever wires this up needs to collect scheduledFor/reminderEmail from
  // the accepting user first, e.g.:
  //   const session = await Session.create({
  //     owner: swap.requester,
  //     skillName: swap.offeredSkill.skillName,
  //     partnerName: recipientUser.name,
  //     partnerId: swap.recipient,
  //     scheduledFor: swap.proposedSchedule?.date,
  //     durationMinutes: swap.proposedSchedule?.durationMinutes,
  //     reminderEmail: requesterUser.email,
  //   });
  //   swap.resultingSession = session._id; await swap.save();

  res.json({ success: true, data: swap });
});

// @desc    Decline a swap request
// @route   PUT /api/swaps/:id/decline
// @access  Private (must be whoever's turn it is to respond)
export const declineSwapRequest = asyncHandler(async (req, res) => {
  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ success: false, message: "Swap request not found" });

  if (!["pending", "countered"].includes(swap.status)) {
    return res.status(400).json({ success: false, message: `Cannot decline a swap with status "${swap.status}"` });
  }

  assertTurnToRespond(swap, req.user.id);

  swap.status = "declined";
  swap.history.push({ action: "declined", by: req.user.id, note: req.body.reason });
  await swap.save();

  res.json({ success: true, data: swap });
});

// @desc    Counter a swap request with new terms
// @route   PUT /api/swaps/:id/counter
// @access  Private (must be whoever's turn it is to respond)
export const counterSwapRequest = asyncHandler(async (req, res) => {
  const { offeredSkill, requestedSkill, proposedSchedule, message } = req.body;
  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ success: false, message: "Swap request not found" });

  if (!["pending", "countered"].includes(swap.status)) {
    return res.status(400).json({ success: false, message: `Cannot counter a swap with status "${swap.status}"` });
  }

  assertTurnToRespond(swap, req.user.id);

  swap.status = "countered";
  swap.counterOffer = {
    offeredSkill: offeredSkill || swap.offeredSkill,
    requestedSkill: requestedSkill || swap.requestedSkill,
    proposedSchedule: proposedSchedule || swap.proposedSchedule,
    message,
    by: req.user.id,
  };
  swap.history.push({ action: "countered", by: req.user.id, note: message });
  await swap.save();

  res.json({ success: true, data: swap });
});

// @desc    Cancel a swap request (requester only, before it's accepted)
// @route   DELETE /api/swaps/:id
// @access  Private
export const cancelSwapRequest = asyncHandler(async (req, res) => {
  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ success: false, message: "Swap request not found" });

  if (String(swap.requester) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: "Only the requester can cancel this swap" });
  }
  if (swap.status === "accepted") {
    return res.status(400).json({ success: false, message: "Cannot cancel an already-accepted swap" });
  }

  swap.status = "cancelled";
  swap.history.push({ action: "cancelled", by: req.user.id });
  await swap.save();

  res.json({ success: true, data: swap });
});

function assertParticipant(swap, userId) {
  const isParticipant =
    String(swap.requester) === String(userId) || String(swap.recipient) === String(userId);
  if (!isParticipant) {
    const err = new Error("Not authorized to access this swap request");
    err.statusCode = 403;
    throw err;
  }
}

// Determines whose turn it is to act on this swap right now, then throws a
// 403 if the logged-in user isn't that person. This is what was missing
// before: a "pending" swap can only be acted on by the recipient, but once a
// counter-offer exists, the turn flips to whichever of the two participants
// did NOT make that counter — otherwise someone could accept/decline/counter
// their own outstanding counter-offer without the other side's consent.
function assertTurnToRespond(swap, userId) {
  let responder = null;

  if (swap.status === "pending") {
    responder = swap.recipient;
  } else if (swap.status === "countered" && swap.counterOffer?.by) {
    responder =
      String(swap.counterOffer.by) === String(swap.requester) ? swap.recipient : swap.requester;
  }

  if (!responder || String(responder) !== String(userId)) {
    const err = new Error("It's not your turn to respond to this swap");
    err.statusCode = 403;
    throw err;
  }
}
