import mongoose from "mongoose";

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    badgeKey: {
      type: String,
      required: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    earnedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

achievementSchema.index(
  {
    user: 1,
    badgeKey: 1
  },
  {
    unique: true
  }
);

export const Achievement = mongoose.model(
  "Achievement",
  achievementSchema
);