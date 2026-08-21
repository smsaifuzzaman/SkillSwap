import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name must be 80 characters or less"]
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },

    role: {
      type: String,
      enum: ["learner", "team-admin", "system-admin"],
      default: "learner"
    },
    membershipPlan: {
      type: String,
      enum: ["Free", "Premium"],
      default: "Free"
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    },

    // Existing fields
    skillLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner"
    },

    expertise: {
      type: [String],
      default: []
    },

    desiredSkills: {
      type: [String],
      default: []
    },

    // ==========================
    // Profile Setup Fields
    // ==========================

    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Bio must be less than 300 characters"]
    },

    location: {
      type: String,
      trim: true,
      default: ""
    },

    profilePhoto: {
      type: String,
      default: ""
    },

    availability: {
      type: String,
      enum: ["Weekdays", "Weekends", "Anytime"],
      default: "Anytime"
    },

    preferredFormat: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: "Online"
    },

    // Average rating
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },

    // Total completed swaps
    totalSwaps: {
      type: Number,
      default: 0
    },

    teachingSkills: [
      {
        skillName: String,
        proficiency: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"]
        },
        sessionDuration: Number,
        preferredFormat: {
          type: String,
          enum: ["Online", "Offline", "Hybrid"]
        },
        description: String
      }
    ],

    learningSkills: [
      {
        skillName: String,
        proficiency: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"]
        },
        sessionDuration: Number,
        preferredFormat: {
          type: String,
          enum: ["Online", "Offline", "Hybrid"]
        },
        description: String
      }
    ],

    // Swap history
    swapHistory: [
      {
        skill: {
          type: String,
          required: true
        },

        partner: {
          type: String,
          default: ""
        },

        date: {
          type: Date,
          default: Date.now
        },

        status: {
          type: String,
          enum: ["Completed", "Pending", "Cancelled"],
          default: "Completed"
        },

        ratingGiven: {
          type: Number,
          default: 0
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// ==========================
// Hash Password
// ==========================

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// ==========================
// Compare Password
// ==========================

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ==========================
// Safe User Object
// ==========================

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    membershipPlan: this.membershipPlan,
    skillLevel: this.skillLevel,
    expertise: this.expertise,
    desiredSkills: this.desiredSkills,
    bio: this.bio,
    location: this.location,
    profilePhoto: this.profilePhoto,
    teachingSkills: this.teachingSkills,
    learningSkills: this.learningSkills,
    availability: this.availability,
    preferredFormat: this.preferredFormat,
    rating: this.rating,
    trustScore: this.trustScore,
    totalSwaps: this.totalSwaps,
    swapHistory: this.swapHistory,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const User = mongoose.model("User", userSchema);