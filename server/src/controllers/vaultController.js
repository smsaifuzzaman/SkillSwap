import fs from "fs";
import path from "path";
import { VaultResource } from "../models/VaultResource.js";

export async function createVaultResource(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please choose a file to upload."
      });
    }

    const resource = await VaultResource.create({
      owner: req.user._id,
      title: req.body.title,
      category: req.body.category || "Learning Material",
      fileUrl: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });

    return res.status(201).json({
      message: "Resource uploaded to your private vault.",
      resource: resource.toClientJSON()
    });
  } catch (error) {
    if (req.file) {
      const filePath = path.join(
        process.cwd(),
        "uploads",
        req.file.filename
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return next(error);
  }
}

export async function getMyVaultResources(req, res, next) {
  try {
    const resources = await VaultResource.find({
      owner: req.user._id
    }).sort({
      createdAt: -1
    });

    return res.json({
      resources: resources.map((resource) =>
        resource.toClientJSON()
      )
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteVaultResource(req, res, next) {
  try {
    const resource = await VaultResource.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!resource) {
      return res.status(404).json({
        message: "Vault resource not found."
      });
    }

    const fileName = path.basename(resource.fileUrl);

    const filePath = path.join(
      process.cwd(),
      "uploads",
      fileName
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await resource.deleteOne();

    return res.json({
      message: "Vault resource deleted."
    });
  } catch (error) {
    return next(error);
  }
}