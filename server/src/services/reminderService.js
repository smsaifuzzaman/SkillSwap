import cron from "node-cron";
import { Session } from "../models/Session.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

// Helper to create a notification easily
export async function createNotification(recipientId, type, title, message, relatedEntityId = null) {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedEntityId,
    });
  } catch (err) {
    console.error("Error creating notification:", err);
  }
}

export function startReminderService() {
  console.log("Starting Reminder Service...");

  // 1. Session Reminders (Runs every hour)
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Find sessions scheduled in exactly the next 24-25 hours
      const upcomingSessions = await Session.find({
        status: "Accepted",
        scheduledFor: {
          $gte: in24Hours,
          $lt: in25Hours,
        },
      });

      for (const session of upcomingSessions) {
        // Notify Owner
        await createNotification(
          session.owner,
          "session_reminder",
          "Upcoming Session Reminder",
          `You have a session for ${session.skillName} scheduled in 24 hours.`,
          session._id
        );
        // Notify Partner
        if (session.partnerId) {
          await createNotification(
            session.partnerId,
            "session_reminder",
            "Upcoming Session Reminder",
            `You have a session for ${session.skillName} scheduled in 24 hours.`,
            session._id
          );
        }
      }
    } catch (err) {
      console.error("Error running session reminders cron:", err);
    }
  });

  // 2. Weekly Summaries (Runs every Monday at 9 AM)
  cron.schedule("0 9 * * 1", async () => {
    try {
      const users = await User.find({});
      for (const user of users) {
        await createNotification(
          user._id,
          "summary",
          "Your Weekly SkillSwap Summary",
          "Check out your activity, trust score updates, and upcoming matches for the week!"
        );
      }
    } catch (err) {
      console.error("Error running weekly summaries cron:", err);
    }
  });
}
