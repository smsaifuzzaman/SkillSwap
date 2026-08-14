import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skillName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["teach", "learn"],
      required: true,
    },
    proficiency: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      required: true,
    },
    sessionDuration: {
      type: Number,
      default: 60,
    },
    preferredFormat: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Online",
    },
    description: {
      type: String,
      default: "",
    },
    // ==========================================
    // Feature 4: 7-Day Skill Boost Fields
    // ==========================================
    isBoosted: {
      type: Boolean,
      default: false,
    },
    boostActivatedAt: {
      type: Date,
      default: null,
    },
    boostExpiresAt: {
      type: Date,
      default: null,
    },
    boostPricePaid: {
      type: Number,
      default: 0,
    },
    renewalCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Method to compute real-time boost status
skillSchema.methods.getBoostStatus = function () {
  if (!this.isBoosted || !this.boostExpiresAt) {
    return "INACTIVE";
  }
  const now = new Date();
  if (now > this.boostExpiresAt) {
    return "EXPIRED";
  }
  const hoursRemaining = (new Date(this.boostExpiresAt).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursRemaining <= 24) {
    return "EXPIRING_SOON";
  }
  return "ACTIVE";
};

export const Skill = mongoose.model("Skill", skillSchema);