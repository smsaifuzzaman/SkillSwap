import { User } from "../models/User.js";

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = req.body.name ?? user.name;
    user.bio = req.body.bio ?? user.bio;
    user.location = req.body.location ?? user.location;
    user.availability = req.body.availability ?? user.availability;
    user.preferredFormat =
      req.body.preferredFormat ?? user.preferredFormat;

    user.desiredSkills =
      req.body.desiredSkills ?? user.desiredSkills;

    await user.save();

    res.json({
      message: "Profile Updated",
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadPhoto(req, res, next) {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    user.profilePhoto = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Profile Photo Updated",
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
}