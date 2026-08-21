import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Milestone title is required"],
      trim: true,
      maxlength: [120, "Milestone title must be 120 characters or less"]
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Milestone description must be 500 characters or less"]
    },

    targetDate: {
      type: Date,
      default: null
    },

    completed: {
      type: Boolean,
      default: false
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const sessionProgressSchema = new mongoose.Schema(
  {
    // ----------------------------------------------------
    // SESSION THAT STARTED THIS LEARNING TRACKER
    // ----------------------------------------------------

    sourceSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true
    },

    // ----------------------------------------------------
    // PARTICIPANTS
    // ----------------------------------------------------

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ----------------------------------------------------
    // SKILL / LEARNING PATH
    // ----------------------------------------------------

    skillName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Skill name must be 100 characters or less"]
    },

    title: {
      type: String,
      trim: true,
      maxlength: [150, "Progress title must be 150 characters or less"],
      default: ""
    },

    goal: {
      type: String,
      trim: true,
      maxlength: [600, "Learning goal must be 600 characters or less"],
      default: ""
    },

    // ----------------------------------------------------
    // MILESTONES
    // ----------------------------------------------------

    milestones: {
      type: [milestoneSchema],
      default: []
    },

    // ----------------------------------------------------
    // SESSION TRACKING
    // ----------------------------------------------------

    totalSessions: {
      type: Number,
      default: 0,
      min: 0
    },

    completedSessions: {
      type: Number,
      default: 0,
      min: 0
    },

    // ----------------------------------------------------
    // OVERALL STATUS
    // ----------------------------------------------------

    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started"
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ----------------------------------------------------
// Prevent creating multiple progress trackers from the
// exact same source session.
// ----------------------------------------------------

sessionProgressSchema.index(
  {
    sourceSession: 1
  },
  {
    unique: true
  }
);

export const SessionProgress = mongoose.model(
  "SessionProgress",
  sessionProgressSchema
);