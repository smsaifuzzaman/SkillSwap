import mongoose from "mongoose";

const portfolioItemSchema = new mongoose.Schema(
  {
    // owner links every portfolio item to the logged-in user who created it.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Portfolio title is required"],
      trim: true,
      maxlength: [120, "Title must be 120 characters or less"]
    },
    skill: {
      type: String,
      required: [true, "Linked skill is required"],
      trim: true,
      maxlength: [80, "Skill must be 80 characters or less"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [600, "Description must be 600 characters or less"]
    },
    projectUrl: {
      type: String,
      trim: true,
      default: ""
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    }
  },
  {
    timestamps: true
  }
);

portfolioItemSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id,
    owner: this.owner,
    title: this.title,
    skill: this.skill,
    description: this.description,
    projectUrl: this.projectUrl,
    imageUrl: this.imageUrl,
    tags: this.tags,
    visibility: this.visibility,
    createdAt: this.createdAt
  };
};

export const PortfolioItem = mongoose.model("PortfolioItem", portfolioItemSchema);
