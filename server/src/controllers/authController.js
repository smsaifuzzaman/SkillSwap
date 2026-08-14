import { User } from "../models/User.js";
import { signAuthToken } from "../utils/tokens.js";

function listFromInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function authResponse(user, statusCode, res) {
  const token = signAuthToken(user);
  return res.status(statusCode).json({
    token,
    user: user.toSafeJSON()
  });
}

export async function signup(req, res, next) {
  try {
    const { name, email, password, skillLevel } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      password,
      skillLevel,
      expertise: listFromInput(req.body.expertise),
      desiredSkills: listFromInput(req.body.desiredSkills)
    });

    return authResponse(user, 201, res);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return authResponse(user, 200, res);
  } catch (error) {
    return next(error);
  }
}

export function getMe(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}
