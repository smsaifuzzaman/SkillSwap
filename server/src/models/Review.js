import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer ID is required"]
    },

    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewed user ID is required"]
    },

    skillName: {
      type: String,
      required: [true, "Skill name is required"],
      trim: true,
      maxlength: [100, "Skill name cannot exceed 100 characters"]
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [0.5, "Rating must be at least 0.5 stars"],
      max: [5, "Rating cannot exceed 5 stars"]
    },

    comment: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Review comment cannot exceed 1000 characters"]
    },

    role: {
      type: String,
      enum: ["Teacher", "Learner", "Peer"],
      default: "Peer"
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.path("rating").validate(function validateHalfStar(value) {
  return Number.isFinite(value) && value * 2 === Math.round(value * 2);
}, "Rating must use half-star increments.");

export const Review = mongoose.model("Review", reviewSchema);

