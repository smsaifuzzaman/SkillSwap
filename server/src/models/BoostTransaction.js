import mongoose from "mongoose";

const boostTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true
    },

    action: {
      type: String,
      enum: ["activate", "renew"],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      default: 100
    },

    currency: {
      type: String,
      default: "BDT"
    },

    paymentMethod: {
      type: String,
      default: "Demo Payment"
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed"
    },

    transactionReference: {
      type: String,
      required: true,
      unique: true
    },

    boostStartsAt: {
      type: Date,
      required: true
    },

    boostExpiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const BoostTransaction = mongoose.model(
  "BoostTransaction",
  boostTransactionSchema
);