import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import crypto from "crypto";

export async function createTeam(req, res) {
  try {
    const { name } = req.body;
    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    
    const team = await Team.create({
      name,
      admin: req.user.id,
      members: [req.user.id],
      inviteCode,
    });

    await User.findByIdAndUpdate(req.user.id, { 
      $push: { teams: team._id },
      role: "team-admin"
    });

    res.status(201).json({ team, message: "Team created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getMyTeam(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user.teams || user.teams.length === 0) {
      // Return empty array instead of 404
      return res.json({ teams: [] });
    }

    const teams = await Team.find({ _id: { $in: user.teams } }).populate("members", "name email profilePhoto role");
    
    // Get sessions for all teams
    const teamIds = teams.map(t => t._id);
    const sessions = await Session.find({ teamId: { $in: teamIds } })
      .populate("owner", "name profilePhoto")
      .populate("participants", "name profilePhoto")
      .sort({ scheduledFor: 1 })
      .limit(50);

    res.json({ teams, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function joinTeam(req, res) {
  try {
    const { inviteCode } = req.body;
    
    const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!team) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    const user = await User.findById(req.user.id);
    if (user.teams && user.teams.includes(team._id)) {
      return res.status(400).json({ message: "You are already in this team." });
    }

    team.members.push(req.user.id);
    await team.save();

    await User.findByIdAndUpdate(req.user.id, { $push: { teams: team._id } });

    res.json({ message: "Successfully joined team", team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function removeMember(req, res) {
  try {
    const { userId, teamId } = req.params;
    
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // User is removing themselves or admin is removing someone else
    if (team.admin.toString() !== req.user.id && req.user.id !== userId) {
      return res.status(403).json({ message: "Not authorized to remove this member" });
    }

    if (team.admin.toString() === userId) {
      return res.status(400).json({ message: "Admin cannot leave. Transfer ownership first." });
    }

    team.members = team.members.filter(m => m.toString() !== userId);
    await team.save();

    await User.findByIdAndUpdate(userId, { $pull: { teams: team._id } });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
