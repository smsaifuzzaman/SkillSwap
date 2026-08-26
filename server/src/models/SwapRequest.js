import mongoose from "mongoose";

// Uses skillName-style naming to match your teachingSkills/learningSkills
// arrays on User.js as closely as possible, while staying a self-contained
// snapshot (so editing your profile later doesn't retroactively change the
// terms of a swap already agreed).

const skillSnapshotSchema = new mongoose.Schema(
  {
    skillName: { type: String, required: true, trim: true },
    proficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Beginner",
    },
  },
  { _id: false }
);

const proposedScheduleSchema = new mongoose.Schema(
  {
    date: { type: Date },
    durationMinutes: { type: Number, default: 60 },
    format: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Online",
    },
  },
  { _id: false }
);

const historyEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["created", "accepted", "declined", "countered", "cancelled", "expired"],
      required: true,
    },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, trim: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const swapRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    offeredSkill: { type: skillSnapshotSchema, required: true },
    requestedSkill: { type: skillSnapshotSchema, required: true },

    message: { type: String, trim: true, maxlength: 1000 },
    proposedSchedule: { type: proposedScheduleSchema },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "countered", "cancelled", "expired"],
      default: "pending",
      index: true,
    },

    counterOffer: {
      offeredSkill: skillSnapshotSchema,
      requestedSkill: skillSnapshotSchema,
      proposedSchedule: proposedScheduleSchema,
      message: { type: String, trim: true, maxlength: 1000 },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // Set once accepted — Module 2's Session Scheduling feature reads this
    // to know a swap is ready to be turned into an actual Session document.
    resultingSession: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },

    history: [historyEntrySchema],

    expiresAt: { type: Date },
  },
  { timestamps: true }
);

swapRequestSchema.index({ requester: 1, status: 1 });
swapRequestSchema.index({ recipient: 1, status: 1 });

export const SwapRequest = mongoose.model("SwapRequest", swapRequestSchema);
