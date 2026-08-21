import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    progressTracker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SessionProgress",
      required: true
    },

    skillName: {
      type: String,
      required: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    verificationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    issuedAt: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: ["Valid", "Revoked"],
      default: "Valid"
    }
  },
  {
    timestamps: true
  }
);

export const Certificate = mongoose.model(
  "Certificate",
  certificateSchema
);