import { User } from "../models/User.js";

export async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;

    if (!q) {
      // If no query, return an empty array or maybe popular users. We'll return empty for now.
      return res.json([]);
    }

    const regex = new RegExp(q, "i");

    // Search by name or desired/offered skills (if we have an offeredSkills field, otherwise just name/location)
    // We'll search name, location, and desiredSkills array
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude self
        {
          $or: [
            { name: { $regex: regex } },
            { location: { $regex: regex } },
            { desiredSkills: { $regex: regex } },
          ]
        }
      ]
    }).limit(20);

    const safeUsers = users.map(user => user.toSafeJSON());

    res.json(safeUsers);
  } catch (err) {
    next(err);
  }
}

export async function getUserProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
}
