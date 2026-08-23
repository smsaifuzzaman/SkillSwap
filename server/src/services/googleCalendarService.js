import { google } from "googleapis";

const calendarScope = "https://www.googleapis.com/auth/calendar.events";

function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      "Google Calendar API is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN."
    );
  }

  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
    scope: calendarScope
  });

  return auth;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getSessionDescription(session) {
  return [
    `SkillSwap session with ${session.partnerName}.`,
    session.meetingLink ? `Meeting link: ${session.meetingLink}` : "",
    session.notes ? `Notes: ${session.notes}` : "",
    session.preferenceNotes ? `Preference notes: ${session.preferenceNotes}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function getSessionLocation(session) {
  return session.meetingLink || session.location || session.format;
}

function getEventStatus(session) {
  if (session.status === "Cancelled") {
    return "cancelled";
  }

  return session.status === "Pending" || session.status === "Change Requested"
    ? "tentative"
    : "confirmed";
}

function buildSessionEvent(session) {
  const start = new Date(session.scheduledFor);
  const end = addMinutes(start, session.durationMinutes || 60);
  const attendeeEmails = [
    session.reminderEmail,
    session.owner?.email,
    session.partnerId?.email
  ].filter(Boolean);
  const uniqueAttendees = [...new Set(attendeeEmails)].map((email) => ({ email }));

  return {
    summary: `SkillSwap: ${session.skillName}`,
    description: getSessionDescription(session),
    location: getSessionLocation(session),
    status: getEventStatus(session),
    start: {
      dateTime: start.toISOString()
    },
    end: {
      dateTime: end.toISOString()
    },
    attendees: uniqueAttendees,
    reminders: {
      useDefault: true
    }
  };
}

export function isGoogleCalendarConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
  );
}

export async function upsertSessionCalendarEvent(session) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const requestBody = buildSessionEvent(session);
  const request = {
    calendarId,
    requestBody,
    sendUpdates: "all"
  };

  if (session.googleCalendarEventId) {
    const response = await calendar.events.update({
      ...request,
      eventId: session.googleCalendarEventId
    });

    return response.data;
  }

  const response = await calendar.events.insert(request);
  return response.data;
}
