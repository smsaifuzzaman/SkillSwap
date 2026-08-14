import { PortfolioItem } from "../models/PortfolioItem.js";

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  // The frontend sends tags as comma-separated text, so this converts it into an array for MongoDB.
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createPortfolioItem(req, res, next) {
  try {
    const portfolioItem = await PortfolioItem.create({
      owner: req.user._id,
      title: req.body.title,
      skill: req.body.skill,
      description: req.body.description,
      projectUrl: req.body.projectUrl,
      // If a picture was uploaded, we save the file path so the frontend can show it later.
      imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
      tags: normalizeTags(req.body.tags),
      visibility: req.body.visibility || "public"
    });

    return res.status(201).json({ portfolioItem: portfolioItem.toClientJSON() });
  } catch (error) {
    return next(error);
  }
}

export async function getMyPortfolioItems(req, res, next) {
  try {
    const portfolioItems = await PortfolioItem.find({ owner: req.user._id }).sort({ createdAt: -1 });

    return res.json({
      portfolioItems: portfolioItems.map((item) => item.toClientJSON())
    });
  } catch (error) {
    return next(error);
  }
}

export async function getPublicPortfolioItems(req, res, next) {
  try {
    const portfolioItems = await PortfolioItem.find({ visibility: "public" })
      .populate("owner", "name email skillLevel")
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({
      portfolioItems: portfolioItems.map((item) => item.toClientJSON())
    });
  } catch (error) {
    return next(error);
  }
}

export async function deletePortfolioItem(req, res, next) {
  try {
    const deletedItem = await PortfolioItem.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!deletedItem) {
      return res.status(404).json({ message: "Portfolio item not found." });
    }

    return res.json({ message: "Portfolio item deleted." });
  } catch (error) {
    return next(error);
  }
}
