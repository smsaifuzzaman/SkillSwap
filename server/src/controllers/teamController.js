import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import crypto from "crypto";

export async function createTeam(req, res) {
  try {
    const { name } = req.body;
    
    if (req.user.team) {
      return res.status(400).json({ message: "You are already in a team." });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    
    const team = await Team.create({
      name,
      admin: req.user.id,
      members: [req.user.id],
      inviteCode,
    });

    await User.findByIdAndUpdate(req.user.id, { 
      team: team._id,
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
    if (!user.team) {
      return res.status(404).json({ message: "You are not in a team" });
    }

    const team = await Team.findById(user.team).populate("members", "name email profilePhoto role");
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Get recent team sessions
    const sessions = await Session.find({ teamId: team._id })
      .populate("owner", "name profilePhoto")
      .populate("participants", "name profilePhoto")
      .sort({ scheduledFor: 1 })
      .limit(10);

    res.json({ team, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function joinTeam(req, res) {
  try {
    const { inviteCode } = req.body;
    
    if (req.user.team) {
      return res.status(400).json({ message: "You are already in a team." });
    }

    const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!team) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    team.members.push(req.user.id);
    await team.save();

    await User.findByIdAndUpdate(req.user.id, { team: team._id });

    res.json({ message: "Successfully joined team", team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function removeMember(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user.id);
    
    const team = await Team.findById(user.team);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only team admins can remove members" });
    }

    if (team.admin.toString() === userId) {
      return res.status(400).json({ message: "Admin cannot remove themselves. Transfer ownership first." });
    }

    team.members = team.members.filter(m => m.toString() !== userId);
    await team.save();

    await User.findByIdAndUpdate(userId, { team: null, role: "learner" });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
