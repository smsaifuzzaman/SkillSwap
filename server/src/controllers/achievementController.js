import crypto from "crypto";

import { Achievement } from "../models/Achievement.js";
import { Certificate } from "../models/Certificate.js";
import { SessionProgress } from "../models/SessionProgress.js";
import { User } from "../models/User.js";

// ----------------------------------------------------
// BADGE DEFINITIONS
// ----------------------------------------------------

const BADGES = {
  milestone_master: {
    badgeKey: "milestone_master",
    title: "Milestone Master",
    description: "Complete at least 5 learning milestones."
  },

  learning_path_finisher: {
    badgeKey: "learning_path_finisher",
    title: "Learning Path Finisher",
    description: "Complete at least 1 full learning progress tracker."
  },

  swap_starter: {
    badgeKey: "swap_starter",
    title: "Swap Starter",
    description: "Complete at least 1 SkillSwap session or swap."
  },

  highly_rated: {
    badgeKey: "highly_rated",
    title: "Highly Rated",
    description: "Maintain a rating of 4.5 or higher."
  },

  consistent_learner: {
    badgeKey: "consistent_learner",
    title: "Consistent Learner",
    description: "Complete milestones across at least 2 different learning paths."
  }
};

// ----------------------------------------------------
// HELPER: CREATE CERTIFICATE CODE
// ----------------------------------------------------

function createVerificationCode() {
  return `SS-CERT-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

// ----------------------------------------------------
// HELPER: COUNT COMPLETED MILESTONES
// ----------------------------------------------------

function countCompletedMilestones(trackers = []) {
  return trackers.reduce((total, tracker) => {
    const completed = (tracker.milestones || []).filter(
      (milestone) => milestone.completed
    ).length;

    return total + completed;
  }, 0);
}

// ----------------------------------------------------
// HELPER: COUNT LEARNING PATHS WITH COMPLETED MILESTONES
// ----------------------------------------------------

function countActiveCompletedPaths(trackers = []) {
  return trackers.filter((tracker) =>
    (tracker.milestones || []).some(
      (milestone) => milestone.completed
    )
  ).length;
}

// ----------------------------------------------------
// HELPER: CHECK TRACKER COMPLETE
// ----------------------------------------------------

function isTrackerCompleted(tracker) {
  const milestones = tracker.milestones || [];

  if (milestones.length === 0) {
    return false;
  }

  return milestones.every(
    (milestone) => milestone.completed
  );
}

// ----------------------------------------------------
// HELPER: AWARD BADGE IF NOT ALREADY EARNED
// ----------------------------------------------------

async function awardBadge(userId, badgeDefinition) {
  const existing = await Achievement.findOne({
    user: userId,
    badgeKey: badgeDefinition.badgeKey
  });

  if (existing) {
    return existing;
  }

  return Achievement.create({
    user: userId,
    badgeKey: badgeDefinition.badgeKey,
    title: badgeDefinition.title,
    description: badgeDefinition.description
  });
}

// ----------------------------------------------------
// EVALUATE + AWARD BADGES
// ----------------------------------------------------

export async function evaluateAchievements(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const trackers = await SessionProgress.find({
      $or: [
        {
          owner: req.user.id
        },
        {
          partner: req.user.id
        }
      ]
    });

    const completedMilestones =
      countCompletedMilestones(trackers);

    const completedTrackers =
      trackers.filter(isTrackerCompleted).length;

    const pathsWithCompletedMilestones =
      countActiveCompletedPaths(trackers);

    const newlyEarned = [];

    // ------------------------------------------------
    // MILESTONE MASTER
    // ------------------------------------------------

    if (completedMilestones >= 5) {
      const achievement = await awardBadge(
        req.user.id,
        BADGES.milestone_master
      );

      newlyEarned.push(achievement);
    }

    // ------------------------------------------------
    // LEARNING PATH FINISHER
    // ------------------------------------------------

    if (completedTrackers >= 1) {
      const achievement = await awardBadge(
        req.user.id,
        BADGES.learning_path_finisher
      );

      newlyEarned.push(achievement);
    }

    // ------------------------------------------------
    // SWAP STARTER
    // ------------------------------------------------

    const completedSwapCount =
      (user.swapHistory || []).filter(
        (swap) => swap.status === "Completed"
      ).length;

    if (
      user.totalSwaps >= 1 ||
      completedSwapCount >= 1
    ) {
      const achievement = await awardBadge(
        req.user.id,
        BADGES.swap_starter
      );

      newlyEarned.push(achievement);
    }

    // ------------------------------------------------
    // HIGHLY RATED
    // ------------------------------------------------

    if (user.rating >= 4.5) {
      const achievement = await awardBadge(
        req.user.id,
        BADGES.highly_rated
      );

      newlyEarned.push(achievement);
    }

    // ------------------------------------------------
    // CONSISTENT LEARNER
    // ------------------------------------------------

    if (pathsWithCompletedMilestones >= 2) {
      const achievement = await awardBadge(
        req.user.id,
        BADGES.consistent_learner
      );

      newlyEarned.push(achievement);
    }

    const achievements = await Achievement.find({
      user: req.user.id
    }).sort({
      earnedAt: -1
    });

    return res.json({
      message: "Achievements evaluated successfully.",

      stats: {
        completedMilestones,
        completedTrackers,
        pathsWithCompletedMilestones,
        rating: user.rating,
        totalSwaps: user.totalSwaps
      },

      achievements
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// GET MY ACHIEVEMENTS
// ----------------------------------------------------

export async function getMyAchievements(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const achievements = await Achievement.find({
      user: req.user.id
    }).sort({
      earnedAt: -1
    });

    const earnedKeys = new Set(
      achievements.map(
        (achievement) => achievement.badgeKey
      )
    );

    const badgeCatalog = Object.values(BADGES).map(
      (badge) => ({
        ...badge,
        earned: earnedKeys.has(badge.badgeKey)
      })
    );

    return res.json({
      membershipPlan: user.membershipPlan || "Free",
      achievements,
      badgeCatalog
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// GET CERTIFICATE-ELIGIBLE LEARNING PATHS
// ----------------------------------------------------

export async function getCertificateEligibleTrackers(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const trackers = await SessionProgress.find({
      owner: req.user.id
    })
      .populate("partner", "name email")
      .sort({
        updatedAt: -1
      });

    const eligibleTrackers = trackers
      .filter(isTrackerCompleted)
      .map((tracker) => ({
        id: tracker._id,
        skillName: tracker.skillName,
        title:
          tracker.title ||
          `${tracker.skillName} Learning Progress`,
        goal: tracker.goal,
        completedAt: tracker.completedAt,
        partner: tracker.partner
      }));

    return res.json({
      membershipPlan: user.membershipPlan || "Free",
      eligibleTrackers
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// GENERATE CERTIFICATE
// ----------------------------------------------------

export async function generateCertificate(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    if (user.membershipPlan !== "Premium") {
      return res.status(403).json({
        message:
          "Verified certificates are available to Premium users only."
      });
    }

    const tracker = await SessionProgress.findOne({
      _id: req.body.progressTrackerId,
      owner: req.user.id
    }).populate(
      "partner",
      "name email"
    );

    if (!tracker) {
      return res.status(404).json({
        message:
          "Completed learning path not found."
      });
    }

    if (!isTrackerCompleted(tracker)) {
      return res.status(400).json({
        message:
          "Certificate can only be generated after completing the learning path."
      });
    }

    const existing = await Certificate.findOne({
      user: req.user.id,
      progressTracker: tracker._id
    });

    if (existing) {
      return res.status(400).json({
        message:
          "A certificate has already been generated for this learning path."
      });
    }

    const verificationCode =
      createVerificationCode();

    const certificate =
      await Certificate.create({
        user: req.user.id,

        progressTracker:
          tracker._id,

        skillName:
          tracker.skillName,

        title:
          `${tracker.skillName} Learning Completion Certificate`,

        verificationCode,

        status:
          "Valid"
      });

    await certificate.populate(
      "user",
      "name email"
    );

    await certificate.populate(
      "progressTracker"
    );

    return res.status(201).json({
      message:
        "Verified certificate generated successfully.",

      certificate
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// GET MY CERTIFICATES
// ----------------------------------------------------

export async function getMyCertificates(req, res) {
  try {
    const certificates =
      await Certificate.find({
        user: req.user.id
      })
        .populate(
          "user",
          "name email"
        )
        .populate(
          "progressTracker"
        )
        .sort({
          issuedAt: -1
        });

    return res.json({
      certificates
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// VERIFY CERTIFICATE
// Public endpoint - no login required later
// ----------------------------------------------------

export async function verifyCertificate(req, res) {
  try {
    const certificate =
      await Certificate.findOne({
        verificationCode:
          req.params.verificationCode
      })
        .populate(
          "user",
          "name"
        )
        .populate(
          "progressTracker",
          "skillName title completedAt"
        );

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message:
          "Certificate verification code was not found."
      });
    }

    if (certificate.status !== "Valid") {
      return res.json({
        valid: false,
        message:
          "This certificate is no longer valid.",
        certificate
      });
    }

    return res.json({
      valid: true,
      message:
        "Certificate verified successfully.",
      certificate
    });
  } catch (error) {
    return res.status(500).json({
      valid: false,
      message: error.message
    });
  }
}