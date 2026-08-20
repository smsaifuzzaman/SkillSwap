import { Session } from "../models/Session.js";
import { SessionProgress } from "../models/SessionProgress.js";

// ----------------------------------------------------
// HELPER: ID TO STRING
// ----------------------------------------------------

function getId(value) {
  return value?._id?.toString() || value?.toString() || "";
}

// ----------------------------------------------------
// HELPER: CHECK PARTICIPANT
// ----------------------------------------------------

function isParticipant(progress, userId) {
  return (
    getId(progress.owner) === userId ||
    getId(progress.partner) === userId
  );
}

// ----------------------------------------------------
// HELPER: CALCULATE PROGRESS
// ----------------------------------------------------

function calculateProgress(milestones = []) {
  if (milestones.length === 0) {
    return 0;
  }

  const completed = milestones.filter(
    (milestone) => milestone.completed
  ).length;

  return Math.round(
    (completed / milestones.length) * 100
  );
}

// ----------------------------------------------------
// HELPER: CALCULATE STATUS
// ----------------------------------------------------

function calculateStatus(milestones = []) {
  if (milestones.length === 0) {
    return "Not Started";
  }

  const completed = milestones.filter(
    (milestone) => milestone.completed
  ).length;

  if (completed === 0) {
    return "Not Started";
  }

  if (completed === milestones.length) {
    return "Completed";
  }

  return "In Progress";
}

// ----------------------------------------------------
// HELPER: SERIALIZE TRACKER
// ----------------------------------------------------

function serializeProgress(progress) {
  const milestones = progress.milestones || [];

  const completedMilestones = milestones.filter(
    (milestone) => milestone.completed
  ).length;

  return {
    id: progress._id,

    sourceSession: progress.sourceSession,

    owner: progress.owner,

    partner: progress.partner,

    skillName: progress.skillName,

    title: progress.title,

    goal: progress.goal,

    milestones,

    totalMilestones: milestones.length,

    completedMilestones,

    progressPercentage:
      calculateProgress(milestones),

    totalSessions:
      progress.totalSessions,

    completedSessions:
      progress.completedSessions,

    status:
      calculateStatus(milestones),

    completedAt:
      progress.completedAt,

    createdAt:
      progress.createdAt,

    updatedAt:
      progress.updatedAt
  };
}

// ----------------------------------------------------
// CREATE PROGRESS TRACKER FROM SESSION
// ----------------------------------------------------

export async function createProgressTracker(req, res) {
  try {
    const session = await Session.findOne({
      _id: req.body.sessionId,

      $or: [
        {
          owner: req.user.id
        },
        {
          partnerId: req.user.id
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        message:
          "Session not found or you are not part of this session."
      });
    }

    if (!session.partnerId) {
      return res.status(400).json({
        message:
          "This session does not have a registered SkillSwap partner."
      });
    }

    if (
      !["Accepted", "Completed"].includes(
        session.status
      )
    ) {
      return res.status(400).json({
        message:
          "A progress tracker can only be created for an accepted or completed session."
      });
    }

    const existing =
      await SessionProgress.findOne({
        sourceSession: session._id
      });

    if (existing) {
      return res.status(400).json({
        message:
          "A progress tracker already exists for this session."
      });
    }

    const progress =
      await SessionProgress.create({
        sourceSession:
          session._id,

        owner:
          session.owner,

        partner:
          session.partnerId,

        skillName:
          session.skillName,

        title:
          req.body.title ||
          `${session.skillName} Learning Progress`,

        goal:
          req.body.goal || "",

        totalSessions: 1,

        completedSessions:
          session.status ===
          "Completed"
            ? 1
            : 0
      });

    return res.status(201).json({
      message:
        "Session progress tracker created successfully.",

      progress:
        serializeProgress(progress)
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// GET ALL MY PROGRESS TRACKERS
// ----------------------------------------------------

export async function getMyProgressTrackers(req, res) {
  try {
    const trackers =
      await SessionProgress.find({
        $or: [
          {
            owner: req.user.id
          },
          {
            partner: req.user.id
          }
        ]
      })
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "partner",
          "name email"
        )
        .populate(
          "sourceSession"
        )
        .sort({
          updatedAt: -1
        });

    return res.json({
      trackers:
        trackers.map(
          serializeProgress
        )
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// GET ONE PROGRESS TRACKER
// ----------------------------------------------------

export async function getProgressTracker(req, res) {
  try {
    const progress =
      await SessionProgress.findById(
        req.params.id
      )
        .populate(
          "owner",
          "name email"
        )
        .populate(
          "partner",
          "name email"
        )
        .populate(
          "sourceSession"
        );

    if (!progress) {
      return res.status(404).json({
        message:
          "Progress tracker not found."
      });
    }

    if (
      !isParticipant(
        progress,
        req.user.id
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to view this progress tracker."
      });
    }

    return res.json({
      progress:
        serializeProgress(progress)
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// UPDATE TRACKER DETAILS
// ----------------------------------------------------

export async function updateProgressTracker(req, res) {
  try {
    const progress =
      await SessionProgress.findById(
        req.params.id
      );

    if (!progress) {
      return res.status(404).json({
        message:
          "Progress tracker not found."
      });
    }

    if (
      !isParticipant(
        progress,
        req.user.id
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to update this progress tracker."
      });
    }

    if (
      typeof req.body.title ===
      "string"
    ) {
      progress.title =
        req.body.title;
    }

    if (
      typeof req.body.goal ===
      "string"
    ) {
      progress.goal =
        req.body.goal;
    }

    await progress.save();

    return res.json({
      message:
        "Progress tracker updated.",

      progress:
        serializeProgress(progress)
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// ADD MILESTONE
// ----------------------------------------------------

export async function addMilestone(req, res) {
  try {
    const progress =
      await SessionProgress.findById(
        req.params.id
      );

    if (!progress) {
      return res.status(404).json({
        message:
          "Progress tracker not found."
      });
    }

    if (
      !isParticipant(
        progress,
        req.user.id
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to add milestones."
      });
    }

    if (
      !req.body.title ||
      !String(req.body.title).trim()
    ) {
      return res.status(400).json({
        message:
          "Milestone title is required."
      });
    }

    progress.milestones.push({
      title:
        req.body.title,

      description:
        req.body.description ||
        "",

      targetDate:
        req.body.targetDate ||
        null
    });

    progress.status =
      calculateStatus(
        progress.milestones
      );

    await progress.save();

    return res.status(201).json({
      message:
        "Milestone added successfully.",

      progress:
        serializeProgress(progress)
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// UPDATE MILESTONE
// ----------------------------------------------------

export async function updateMilestone(req, res) {
  try {
    const progress =
      await SessionProgress.findById(
        req.params.id
      );

    if (!progress) {
      return res.status(404).json({
        message:
          "Progress tracker not found."
      });
    }

    if (
      !isParticipant(
        progress,
        req.user.id
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to update milestones."
      });
    }

    const milestone =
      progress.milestones.id(
        req.params.milestoneId
      );

    if (!milestone) {
      return res.status(404).json({
        message:
          "Milestone not found."
      });
    }

    if (
      typeof req.body.title ===
      "string"
    ) {
      milestone.title =
        req.body.title;
    }

    if (
      typeof req.body.description ===
      "string"
    ) {
      milestone.description =
        req.body.description;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "targetDate"
      )
    ) {
      milestone.targetDate =
        req.body.targetDate ||
        null;
    }

    await progress.save();

    return res.json({
      message:
        "Milestone updated successfully.",

      progress:
        serializeProgress(progress)
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// TOGGLE MILESTONE COMPLETE / INCOMPLETE
// ----------------------------------------------------

export async function toggleMilestone(req, res) {
  try {
    const progress =
      await SessionProgress.findById(
        req.params.id
      );

    if (!progress) {
      return res.status(404).json({
        message:
          "Progress tracker not found."
      });
    }

    if (
      !isParticipant(
        progress,
        req.user.id
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to update milestones."
      });
    }

    const milestone =
      progress.milestones.id(
        req.params.milestoneId
      );

    if (!milestone) {
      return res.status(404).json({
        message:
          "Milestone not found."
      });
    }

    milestone.completed =
      !milestone.completed;

    milestone.completedAt =
      milestone.completed
        ? new Date()
        : null;

    const status =
      calculateStatus(
        progress.milestones
      );

    progress.status =
      status;

    progress.completedAt =
      status === "Completed"
        ? new Date()
        : null;

    await progress.save();

    return res.json({
      message:
        milestone.completed
          ? "Milestone completed."
          : "Milestone marked incomplete.",

      progress:
        serializeProgress(progress)
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

// ----------------------------------------------------
// DELETE MILESTONE
// ----------------------------------------------------

export async function deleteMilestone(req, res) {
  try {
    const progress =
      await SessionProgress.findById(
        req.params.id
      );

    if (!progress) {
      return res.status(404).json({
        message:
          "Progress tracker not found."
      });
    }

    if (
      !isParticipant(
        progress,
        req.user.id
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to delete milestones."
      });
    }

    const milestone =
      progress.milestones.id(
        req.params.milestoneId
      );

    if (!milestone) {
      return res.status(404).json({
        message:
          "Milestone not found."
      });
    }

    milestone.deleteOne();

    const status =
      calculateStatus(
        progress.milestones
      );

    progress.status =
      status;

    progress.completedAt =
      status === "Completed"
        ? new Date()
        : null;

    await progress.save();

    return res.json({
      message:
        "Milestone deleted.",

      progress:
        serializeProgress(progress)
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}