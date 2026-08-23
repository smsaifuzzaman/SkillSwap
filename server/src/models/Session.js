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

    isGroup: {
      type: Boolean,
      default: false
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    maxParticipants: {
      type: Number,
      default: 10
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
    },

    googleCalendarEventId: {
      type: String,
      trim: true,
      default: ""
    },

    googleCalendarHtmlLink: {
      type: String,
      trim: true,
      default: ""
    },

    googleCalendarSyncedAt: {
      type: Date,
      default: null
    },

    googleCalendarSyncStatus: {
      type: String,
      enum: ["Not Synced", "Synced", "Failed"],
      default: "Not Synced"
    },

    googleCalendarSyncError: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Calendar sync error cannot exceed 300 characters"]
    },

    ratings: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        reviewedUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        score: {
          type: Number,
          required: true,
          min: [0.5, "Rating must be at least 0.5 stars"],
          max: [5, "Rating cannot be more than 5 stars"]
        },
        comment: {
          type: String,
          trim: true,
          default: "",
          maxlength: [1000, "Review comment cannot exceed 1000 characters"]
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

sessionSchema.path("ratings").schema.path("score").validate(function validateHalfStar(value) {
  return Number.isFinite(value) && value * 2 === Math.round(value * 2);
}, "Rating must use half-star increments.");

export const Session = mongoose.model("Session", sessionSchema);
