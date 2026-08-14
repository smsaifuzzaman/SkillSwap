import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { connectDB } from "./src/config/db.js";
import { User } from "./src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const popularSkills = [
  "React", "Node.js", "Python", "Java", "Docker", "AWS", "CSS", "UI/UX", "Figma", 
  "Machine Learning", "Go", "C++", "SQL", "GraphQL", "TailwindCSS"
];

function getRandomSkills(count) {
  const shuffled = popularSkills.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(skillName => ({ skillName, proficiency: "Advanced" }));
}

async function run() {
  try {
    await connectDB();
    console.log("Connected to DB...");

    // Fix availability array issue directly in DB
    await User.collection.updateMany(
      { availability: { $type: "array" } },
      { $set: { availability: "Anytime" } }
    );
    console.log("Fixed any invalid availability fields.");

    const users = await User.find({});
    let updatedCount = 0;

    for (let user of users) {
      let changed = false;

      if (!user.teachingSkills || user.teachingSkills.length === 0) {
        user.teachingSkills = getRandomSkills(2);
        changed = true;
      }
      
      if (!user.learningSkills || user.learningSkills.length === 0) {
        user.learningSkills = getRandomSkills(2);
        changed = true;
      }

      if (changed) {
        await user.save();
        updatedCount++;
      }
    }

    console.log(`Successfully added skills to ${updatedCount} profiles!`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating users:", error);
    process.exit(1);
  }
}

run();
