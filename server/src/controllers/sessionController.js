import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { Team } from "../models/Team.js";
import { Review } from "../models/Review.js";
import { createNotification } from "../services/reminderService.js";
import {
  isGoogleCalendarConfigured,
  upsertSessionCalendarEvent
} from "../services/googleCalendarService.js";
import mongoose from "mongoose";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5001/api/sessions/auth/google/callback"
);

function getIdString(value) {
  return value?._id?.toString() || value?.toString() || "";
}

function serializeSession(session, viewerId) {
  const status = session.status === "Scheduled" ? "Accepted" : session.status;
  const ownerId = getIdString(session.owner);
  const partnerId = getIdString(session.partnerId);
  const viewerRole = viewerId === partnerId ? "recipient" : "requester";
  const viewerRating = session.ratings?.find((rating) => getIdString(rating.reviewer) === viewerId);
  const receivedRating = session.ratings?.find((rating) => getIdString(rating.reviewedUser) === viewerId);

  return {
    id: session._id,
    ownerId,
    requesterName: session.owner?.name || "SkillSwap member",
    skillName: session.skillName,
    partnerName: session.partnerName,
    partnerId,
    scheduledFor: session.scheduledFor,
    durationMinutes: session.durationMinutes,
    format: session.format,
    meetingLink: session.meetingLink,
    location: session.location,
    reminderEmail: session.reminderEmail,
    notes: session.notes,
    preferenceNotes: session.preferenceNotes,
    status,
    viewerRole,
    viewerRating: viewerRating
      ? {
          score: viewerRating.score,
          comment: viewerRating.comment || "",
          updatedAt: viewerRating.updatedAt || viewerRating.createdAt
        }
      : null,
    receivedRating: receivedRating
      ? {
          score: receivedRating.score,
          comment: receivedRating.comment || "",
          updatedAt: receivedRating.updatedAt || receivedRating.createdAt
        }
      : null,
    googleCalendarEventId: session.googleCalendarEventId,
    googleCalendarHtmlLink: session.googleCalendarHtmlLink,
    googleCalendarSyncedAt: session.googleCalendarSyncedAt,
    googleCalendarSyncStatus: session.googleCalendarSyncStatus,
    googleCalendarSyncError: session.googleCalendarSyncError,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}

function getStoredCalendarError(error) {
  const message = error.message || "Google Calendar sync failed.";
  return message.length > 300 ? `${message.slice(0, 297)}...` : message;
}

async function syncGoogleCalendarEvent(session) {
  try {
    const event = await upsertSessionCalendarEvent(session);

    session.googleCalendarEventId = event.id || session.googleCalendarEventId;
    session.googleCalendarHtmlLink = event.htmlLink || session.googleCalendarHtmlLink;
    session.googleCalendarSyncedAt = new Date();
    session.googleCalendarSyncStatus = "Synced";
    session.googleCalendarSyncError = "";

    await session.save();

    return {
      ok: true,
      event
    };
  } catch (error) {
    session.googleCalendarSyncStatus = "Failed";
    session.googleCalendarSyncError = getStoredCalendarError(error);
    await session.save();

    return {
      ok: false,
      error
    };
  }
}

function isHalfStarRating(value) {
  return Number.isFinite(value) && value >= 0.5 && value <= 5 && value * 2 === Math.round(value * 2);
}

async function refreshUserAverageRating(userId) {
  const reviewedUserObjectId = new mongoose.Types.ObjectId(userId);
  const results = await Session.aggregate([
    {
      $unwind: "$ratings"
    },
    {
      $match: {
        "ratings.reviewedUser": reviewedUserObjectId
      }
    },
    {
      $group: {
        _id: "$ratings.reviewedUser",
        averageRating: {
          $avg: "$ratings.score"
        }
      }
    }
  ]);

  const averageRating = results[0]?.averageRating || 0;

  await User.findByIdAndUpdate(reviewedUserObjectId, {
    rating: Math.round(averageRating * 10) / 10
  });
}

export async function createSession(req, res) {
  try {
    const scheduledFor = new Date(req.body.scheduledFor);

    if (Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({
        message: "Please choose a valid session date and time."
      });
    }

    const createdSession = await Session.create({
      owner: req.user.id,
      skillName: req.body.skillName,
      partnerName: req.body.isGroup ? "Team Members" : req.body.partnerName,
      partnerId: req.body.partnerId || null,
      isGroup: req.body.isGroup || false,
      teamId: req.body.teamId || null,
      maxParticipants: req.body.maxParticipants || 10,
      participants: req.body.isGroup ? [req.user.id] : [],
      scheduledFor,
      durationMinutes: req.body.durationMinutes,
      format: req.body.format,
      meetingLink: req.body.meetingLink,
      location: req.body.location,
      reminderEmail: req.body.reminderEmail,
      notes: req.body.notes,
      preferenceNotes: req.body.preferenceNotes,
      status: req.body.isGroup ? "Accepted" : "Pending" // Group swaps are auto-accepted
    });

    const session = await Session.findById(createdSession._id)
      .populate("owner", "name email")
      .populate("partnerId", "name email");

    
    const ownerUser = await User.findById(req.user.id);
    const partnerUser = session.partnerId ? await User.findById(session.partnerId) : null;
    
    // Attempt to create Google Calendar Event
    if (ownerUser && ownerUser.googleTokens) {
      await createGoogleCalendarEvent(session, ownerUser, partnerUser?.email);
    }
    
    if (session.partnerId) {
      await createNotification(
        session.partnerId,
        "match",
        "New Session Request",
        `${req.user.name || "Someone"} has requested a ${req.body.skillName} session with you.`,
        session._id
      );
    } else if (session.isGroup && session.teamId) {
      const team = await Team.findById(session.teamId);
      if (team && team.members) {
        for (const memberId of team.members) {
          if (String(memberId) !== String(req.user.id)) {
            await createNotification(
              memberId,
              "team",
              "New Group Meeting",
              `${req.user.name || "A team admin"} scheduled a new group meeting: ${req.body.skillName}.`,
              session._id
            );
          }
        }
      }
    }

    if (isGoogleCalendarConfigured()) {
      await syncGoogleCalendarEvent(session);
    }

    res.status(201).json({
      session: serializeSession(session, req.user.id),
      message: isGoogleCalendarConfigured()
        ? "Session request sent and synced with Google Calendar."
        : "Session request sent. Google Calendar API credentials are not configured yet."
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
}

export async function getSessions(req, res) {
  try {
    const sessions = await Session.find({
      $or: [
        {
          owner: req.user.id
        },
        {
          partnerId: req.user.id
        }
      ]
    })
      .populate("owner", "name email")
      .populate("partnerId", "name email")
      .sort({
        scheduledFor: 1
      });

    res.json({
      sessions: sessions.map((session) => serializeSession(session, req.user.id))
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
}

export async function updateSessionStatus(req, res) {
  try {
    const allowedStatuses = ["Pending", "Accepted", "Change Requested", "Completed", "Cancelled"];

    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({
        message: "Status must be Pending, Accepted, Change Requested, Completed, or Cancelled."
      });
    }

    const existingSession = await Session.findOne({
      _id: req.params.id,
      $or: [
        {
          owner: req.user.id
        },
        {
          partnerId: req.user.id
        }
      ]
    });

    if (!existingSession) {
      return res.status(404).json({
        message: "Session not found."
      });
    }

    const isRequester = getIdString(existingSession.owner) === req.user.id;
    const isRecipient = getIdString(existingSession.partnerId) === req.user.id;
    const requesterAllowedStatuses = ["Cancelled"];

    if (isRequester && !requesterAllowedStatuses.includes(req.body.status)) {
      return res.status(403).json({
        message: "Only the user whose skill is requested can accept or change this session."
      });
    }

    if (!isRecipient && !isRequester) {
      return res.status(403).json({
        message: "You do not have permission to update this session."
      });
    }

    const update = isRecipient
      ? {
          status: req.body.status,
          preferenceNotes: req.body.preferenceNotes
        }
      : {
          status: req.body.status
        };

    const session = await Session.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    })
      .populate("owner", "name email")
      .populate("partnerId", "name email");

    if (isGoogleCalendarConfigured()) {
      await syncGoogleCalendarEvent(session);
    }

    res.json({
      session: serializeSession(session, req.user.id)
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
}

export async function syncSessionCalendar(req, res) {
  try {
    if (!isGoogleCalendarConfigured()) {
      return res.status(503).json({
        message:
          "Google Calendar API is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN."
      });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      $or: [
        {
          owner: req.user.id
        },
        {
          partnerId: req.user.id
        }
      ]
    })
      .populate("owner", "name email")
      .populate("partnerId", "name email");

    if (!session) {
      return res.status(404).json({
        message: "Session not found."
      });
    }

    const result = await syncGoogleCalendarEvent(session);

    if (!result.ok) {
      return res.status(502).json({
        session: serializeSession(session, req.user.id),
        message: `Google Calendar sync failed: ${result.error.message}`
      });
    }

    res.json({
      session: serializeSession(session, req.user.id),
      message: "Session synced with Google Calendar.",
      googleCalendarHtmlLink: session.googleCalendarHtmlLink
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
}

export async function rateSessionPartner(req, res) {
  try {
    const score = Number(req.body.score);

    if (!isHalfStarRating(score)) {
      return res.status(400).json({
        message: "Rating must be between 0.5 and 5 in half-star increments."
      });
    }

    const existingSession = await Session.findOne({
      _id: req.params.id,
      $or: [
        {
          owner: req.user.id
        },
        {
          partnerId: req.user.id
        }
      ]
    });

    if (!existingSession) {
      return res.status(404).json({
        message: "Session not found."
      });
    }

    if (!["Accepted", "Completed", "Scheduled"].includes(existingSession.status)) {
      return res.status(400).json({
        message: "You can rate after the requested session is accepted."
      });
    }

    const ownerId = getIdString(existingSession.owner);
    const partnerId = getIdString(existingSession.partnerId);
    const isRequester = ownerId === req.user.id;
    const isRecipient = partnerId === req.user.id;

    if (!isRequester && !isRecipient) {
      return res.status(403).json({
        message: "You do not have permission to rate this session."
      });
    }

    const reviewedUserId = isRequester ? partnerId : ownerId;

    if (!reviewedUserId) {
      return res.status(400).json({
        message: "This session does not have a registered partner to rate."
      });
    }

    const now = new Date();
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : undefined;
    const existingRating = existingSession.ratings.find(
      (rating) => getIdString(rating.reviewer) === req.user.id
    );

    if (existingRating) {
      existingRating.score = score;
      if (comment !== undefined) {
        existingRating.comment = comment;
      }
      existingRating.reviewedUser = reviewedUserId;
      existingRating.updatedAt = now;
    } else {
      existingSession.ratings.push({
        reviewer: req.user.id,
        reviewedUser: reviewedUserId,
        score,
        comment: comment !== undefined ? comment : "",
        createdAt: now,
        updatedAt: now
      });
    }

    await existingSession.save();
    await refreshUserAverageRating(reviewedUserId);

    // Sync with Review model
    await Review.findOneAndUpdate(
      {
        session: existingSession._id,
        reviewer: req.user.id
      },
      {
        session: existingSession._id,
        reviewer: req.user.id,
        reviewedUser: reviewedUserId,
        skillName: existingSession.skillName,
        rating: score,
        comment: comment !== undefined ? comment : (existingRating?.comment || ""),
        role: isRecipient ? "Teacher" : "Learner",
        updatedAt: now
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const session = await Session.findById(req.params.id)
      .populate("owner", "name email")
      .populate("partnerId", "name email");

    res.json({
      session: serializeSession(session, req.user.id),
      message: "Rating saved."
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
}

export async function deleteSession(req, res) {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!session) {
      return res.status(404).json({
        message: "Session not found."
      });
    }

    res.json({
      message: "Session deleted."
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
}

// Join a Group Session
export async function joinGroupSession(req, res) {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!session.isGroup) {
      return res.status(400).json({ message: "This is not a group session." });
    }

    // Check if team member
    const user = await User.findById(req.user.id);
    if (session.teamId && (!user.teams || !user.teams.some(tId => String(tId) === String(session.teamId)))) {
      return res.status(403).json({ message: "You must be in the team to join this group swap." });
    }

    if (session.participants.includes(req.user.id)) {
      return res.status(400).json({ message: "You have already joined this session." });
    }

    if (session.participants.length >= session.maxParticipants) {
      return res.status(400).json({ message: "This session is full." });
    }

    session.participants.push(req.user.id);
    await session.save();

    res.json({ message: "Successfully joined the group session!", session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export function getGoogleAuthUrl(req, res) {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state: req.user.id
  });
  res.json({ url });
}

export async function googleAuthCallback(req, res) {
  try {
    const { code, state: userId } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    await User.findByIdAndUpdate(userId, { googleTokens: tokens });
    res.send("Google Calendar linked successfully! You can close this window.");
  } catch (error) {
    res.status(500).send("Error linking Google Calendar: " + error.message);
  }
}

async function createGoogleCalendarEvent(session, owner, partnerEmail) {
  if (!owner.googleTokens) return;
  oauth2Client.setCredentials(owner.googleTokens);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  
  const start = new Date(session.scheduledFor);
  const end = new Date(start.getTime() + (session.durationMinutes || 60) * 60000);
  
  const event = {
    summary: `SkillSwap: ${session.skillName}`,
    description: `SkillSwap session.
Notes: ${session.notes || ""}`,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    location: session.meetingLink || session.location || "",
    attendees: partnerEmail ? [{ email: partnerEmail }] : []
  };

  try {
    await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all"
    });
  } catch (error) {
    console.error("Google Calendar Insert Error:", error);
  }
}
