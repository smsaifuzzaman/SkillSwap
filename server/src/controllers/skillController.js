import { Skill } from "../models/Skill.js";

const proficiencyRank = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4
};

function cleanSkillName(skillName = "") {
  return skillName.trim().toLowerCase();
}

function getDescriptionWords(description = "") {
  return description
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
}

function buildMatchScore(learningSkill, teachingSkill) {
  let score = 55;
  const reasons = [];

  // Main matching logic: same skill name means this person can teach what I want to learn.
  if (cleanSkillName(learningSkill.skillName) === cleanSkillName(teachingSkill.skillName)) {
    score += 25;
    reasons.push(`Both users matched on ${teachingSkill.skillName}.`);
  }

  if (learningSkill.preferredFormat === teachingSkill.preferredFormat) {
    score += 10;
    reasons.push(`Both prefer ${teachingSkill.preferredFormat} sessions.`);
  }

  if ((proficiencyRank[teachingSkill.proficiency] || 0) >= (proficiencyRank[learningSkill.proficiency] || 0)) {
    score += 8;
    reasons.push(`${teachingSkill.proficiency} teaching level fits your ${learningSkill.proficiency} goal.`);
  }

  if (Math.abs((learningSkill.sessionDuration || 60) - (teachingSkill.sessionDuration || 60)) <= 30) {
    score += 5;
    reasons.push("Session duration is close to your preference.");
  }

  const learningWords = new Set(getDescriptionWords(learningSkill.description));
  const sharedWords = getDescriptionWords(teachingSkill.description).filter((word) => learningWords.has(word));

  if (sharedWords.length > 0) {
    score += 4;
    reasons.push("Descriptions have similar keywords.");
  }

  return {
    score: Math.min(score, 100),
    reasons
  };
}

export const createSkill = async (req,res)=>{

try{

const skill=await Skill.create({
    owner:req.user.id,
    ...req.body
});

res.status(201).json(skill);

}catch(err){

res.status(500).json({
message:err.message
});

}

};

export const getSkills=async(req,res)=>{

const skills=await Skill.find({
owner:req.user.id
});

res.json(skills);

};

export const updateSkill=async(req,res)=>{

const skill=await Skill.findByIdAndUpdate(

req.params.id,

req.body,

{
new:true
}

);

res.json(skill);

};

export const deleteSkill=async(req,res)=>{

await Skill.findByIdAndDelete(req.params.id);

res.json({
message:"Skill deleted"
});

};

export const getSkillMatches = async (req, res) => {
  try {
    const mySkills = await Skill.find({
      owner: req.user.id
    });

    const learningSkills = mySkills.filter((skill) => skill.type === "learn");

    if (learningSkills.length === 0) {
      return res.json({
        matches: [],
        message: "Add at least one skill you want to learn to get matches."
      });
    }

    const possibleTeachers = await Skill.find({
      owner: { $ne: req.user.id },
      type: "teach"
    }).populate("owner", "name email location availability preferredFormat rating totalSwaps");

    const matches = [];

    learningSkills.forEach((learningSkill) => {
      possibleTeachers.forEach((teachingSkill) => {
        if (cleanSkillName(learningSkill.skillName) !== cleanSkillName(teachingSkill.skillName)) {
          return;
        }

        const match = buildMatchScore(learningSkill, teachingSkill);

        // Keeping only useful matches so the page does not feel random.
        if (match.score < 60) {
          return;
        }

        matches.push({
          id: `${learningSkill._id}-${teachingSkill._id}`,
          score: match.score,
          reasons: match.reasons,
          learningSkill: {
            id: learningSkill._id,
            skillName: learningSkill.skillName,
            proficiency: learningSkill.proficiency,
            preferredFormat: learningSkill.preferredFormat,
            sessionDuration: learningSkill.sessionDuration,
            description: learningSkill.description
          },
          teacherSkill: {
            id: teachingSkill._id,
            skillName: teachingSkill.skillName,
            proficiency: teachingSkill.proficiency,
            preferredFormat: teachingSkill.preferredFormat,
            sessionDuration: teachingSkill.sessionDuration,
            description: teachingSkill.description
          },
          teacher: {
            id: teachingSkill.owner?._id,
            name: teachingSkill.owner?.name || "SkillSwap member",
            email: teachingSkill.owner?.email || "",
            location: teachingSkill.owner?.location || "",
            availability: teachingSkill.owner?.availability || "Anytime",
            preferredFormat: teachingSkill.owner?.preferredFormat || teachingSkill.preferredFormat,
            rating: teachingSkill.owner?.rating || 0,
            totalSwaps: teachingSkill.owner?.totalSwaps || 0
          }
        });
      });
    });

    matches.sort((first, second) => second.score - first.score);

    res.json({
      matches,
      totalLearningSkills: learningSkills.length
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};
