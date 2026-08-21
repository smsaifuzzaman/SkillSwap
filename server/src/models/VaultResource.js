import mongoose from "mongoose";

const vaultResourceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
      maxlength: [120, "Title must be 120 characters or less"]
    },

    category: {
      type: String,
      enum: ["Notes", "Learning Material", "Certificate", "Portfolio"],
      default: "Learning Material"
    },

    fileUrl: {
      type: String,
      required: [true, "Resource file is required"]
    },

    originalName: {
      type: String,
      required: true
    },

    fileType: {
      type: String,
      default: ""
    },

    fileSize: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

vaultResourceSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id,
    title: this.title,
    category: this.category,
    fileUrl: this.fileUrl,
    originalName: this.originalName,
    fileType: this.fileType,
    fileSize: this.fileSize,
    createdAt: this.createdAt
  };
};

export const VaultResource = mongoose.model(
  "VaultResource",
  vaultResourceSchema
);