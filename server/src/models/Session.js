import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    skillName: {
      type: String,
      required: [true, "Skill name is required"],
      trim: true,
      maxlength: [100, "Skill name must be 100 characters or less"]
    },

    partnerName: {
      type: String,
      required: [true, "Partner name is required"],
      trim: true,
      maxlength: [80, "Partner name must be 80 characters or less"]
    },

    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    scheduledFor: {
      type: Date,
      required: [true, "Session date and time are required"]
    },

    durationMinutes: {
      type: Number,
      default: 60,
      min: [15, "Session must be at least 15 minutes"],
      max: [240, "Session cannot be longer than 240 minutes"]
    },

    format: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Online"
    },

    meetingLink: {
      type: String,
      trim: true,
      default: ""
    },

    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: [160, "Location must be 160 characters or less"]
    },

    reminderEmail: {
      type: String,
      required: [true, "A real reminder email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid real email address"]
    },

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [400, "Notes must be 400 characters or less"]
    },

    preferenceNotes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [400, "Preference notes must be 400 characters or less"]
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Change Requested", "Completed", "Cancelled"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

export const Session = mongoose.model("Session", sessionSchema);
