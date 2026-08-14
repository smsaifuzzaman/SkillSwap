import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { connectDB } from "./src/config/db.js";
import { User } from "./src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const users = [
  {
    name: "Alice Frontend",
    email: "alice@example.com",
    password: "password123",
    role: "learner",
    bio: "Frontend developer looking to learn backend.",
    location: "New York, USA",
    teachingSkills: [{ skillName: "React", proficiency: "Advanced" }, { skillName: "CSS", proficiency: "Expert" }],
    learningSkills: [{ skillName: "Node.js" }, { skillName: "Python" }]
  },
  {
    name: "Bob Backend",
    email: "bob@example.com",
    password: "password123",
    role: "learner",
    bio: "Backend specialist looking for design skills.",
    location: "London, UK",
    teachingSkills: [{ skillName: "Node.js", proficiency: "Expert" }, { skillName: "Express", proficiency: "Advanced" }],
    learningSkills: [{ skillName: "Figma" }, { skillName: "React" }]
  },
  {
    name: "Charlie Designer",
    email: "charlie@example.com",
    password: "password123",
    role: "learner",
    bio: "UX Designer wanting to learn coding.",
    location: "Berlin, DE",
    teachingSkills: [{ skillName: "Figma", proficiency: "Expert" }, { skillName: "UI/UX", proficiency: "Advanced" }],
    learningSkills: [{ skillName: "React" }, { skillName: "CSS" }]
  },
  {
    name: "Diana Data",
    email: "diana@example.com",
    password: "password123",
    role: "learner",
    bio: "Data scientist looking for web dev skills.",
    location: "Toronto, CA",
    teachingSkills: [{ skillName: "Python", proficiency: "Expert" }, { skillName: "Machine Learning", proficiency: "Advanced" }],
    learningSkills: [{ skillName: "React" }, { skillName: "Docker" }]
  },
  {
    name: "Eve DevOps",
    email: "eve@example.com",
    password: "password123",
    role: "learner",
    bio: "DevOps engineer wanting to learn Python.",
    location: "San Francisco, USA",
    teachingSkills: [{ skillName: "Docker", proficiency: "Expert" }, { skillName: "AWS", proficiency: "Advanced" }],
    learningSkills: [{ skillName: "Python" }, { skillName: "Go" }]
  }
];

async function seed() {
  try {
    await connectDB();
    console.log("Connected to DB...");

    // Remove existing seed users to avoid duplicate emails
    await User.deleteMany({ email: { $in: users.map(u => u.email) } });
    console.log("Cleared old seed users.");

    for (let user of users) {
      await User.create(user);
    }
    console.log(`Successfully seeded ${users.length} users!`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}

seed();
