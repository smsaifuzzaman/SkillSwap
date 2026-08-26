import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    relatedSwap: { type: mongoose.Schema.Types.ObjectId, ref: "SwapRequest", default: null },
    relatedSession: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },

    reason: {
      type: String,
      enum: ["no-show", "inappropriate-behavior", "quality-issue", "harassment", "scam", "other"],
      required: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    evidence: [{ url: String, name: String }],

    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "dismissed"],
      default: "open",
      index: true,
    },

    adminNotes: [
      {
        admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: { type: String, trim: true },
        at: { type: Date, default: Date.now },
      },
    ],

    resolution: {
      action: {
        type: String,
        enum: ["warning", "rating_penalty", "temporary_suspension", "account_ban", "no_action"],
      },
      summary: { type: String, trim: true },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolvedAt: { type: Date },
    },
  },
  { timestamps: true }
);

disputeSchema.index({ reportedUser: 1, status: 1 });

export const Dispute = mongoose.model("Dispute", disputeSchema);
