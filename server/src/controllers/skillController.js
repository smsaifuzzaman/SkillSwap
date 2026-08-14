import { Skill } from "../models/Skill.js";
import { User } from "../models/User.js";

const proficiencyRank = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4
};

function cleanSkillName(skillName = "") {
  return String(skillName || "").trim().toLowerCase();
}

function getDescriptionWords(description = "") {
  return String(description || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);
}

function getAvailabilityScore(learnerAvailability = "Anytime", teacherAvailability = "Anytime") {
  if (learnerAvailability === teacherAvailability) {
    return {
      points: 12,
      reason: `Both users are available on ${teacherAvailability}.`
    };
  }

  if (learnerAvailability === "Anytime" || teacherAvailability === "Anytime") {
    return {
      points: 4,
      reason: "One user has flexible availability."
    };
  }

  return {
    points: -22,
    reason: `${learnerAvailability} and ${teacherAvailability} availability do not match.`
  };
}

function buildMatchScore(learningSkill, teachingSkill, learner) {
  let score = 50;
  const reasons = [];

  if (cleanSkillName(learningSkill.skillName) === cleanSkillName(teachingSkill.skillName)) {
    score += 30;
    reasons.push(`Both users matched on ${teachingSkill.skillName}.`);
  }

  if (learningSkill.preferredFormat === teachingSkill.preferredFormat) {
    score += 14;
    reasons.push(`Both prefer ${teachingSkill.preferredFormat} sessions.`);
  } else {
    score -= 18;
    reasons.push(`Format mismatch: you prefer ${learningSkill.preferredFormat}, teacher offers ${teachingSkill.preferredFormat}.`);
  }

  const teacherRank = proficiencyRank[teachingSkill.proficiency] || 0;
  const learnerRank = proficiencyRank[learningSkill.proficiency] || 0;

  if (teacherRank >= learnerRank) {
    score += teacherRank === learnerRank ? 10 : 14;
    reasons.push(`${teachingSkill.proficiency} teaching level fits your ${learningSkill.proficiency} goal.`);
  } else {
    score -= 24 + (learnerRank - teacherRank) * 6;
    reasons.push(`${teachingSkill.proficiency} teaching level is below your ${learningSkill.proficiency} goal.`);
  }

  const learnerDuration = learningSkill.sessionDuration || 60;
  const teacherDuration = teachingSkill.sessionDuration || 60;
  const durationDifference = Math.abs(learnerDuration - teacherDuration);

  if (durationDifference === 0) {
    score += 15;
    reasons.push("Session duration exactly matches your preference.");
  } else if (durationDifference <= 15) {
    score -= 10;
    reasons.push(`Duration differs by ${durationDifference} minutes.`);
  } else if (durationDifference <= 30) {
    score -= 20;
    reasons.push(`Duration differs by ${durationDifference} minutes.`);
  } else {
    score -= 35;
    reasons.push(`Duration differs too much: ${learnerDuration} minutes vs ${teacherDuration} minutes.`);
  }

  const availabilityScore = getAvailabilityScore(learner.availability, teachingSkill.owner?.availability);
  score += availabilityScore.points;
  reasons.push(availabilityScore.reason);

  const learningWords = new Set(getDescriptionWords(learningSkill.description));
  const sharedWords = getDescriptionWords(teachingSkill.description).filter((word) => learningWords.has(word));

  if (sharedWords.length > 0) {
    score += 4;
    reasons.push("Descriptions have similar keywords.");
  }

  return {
    score: Math.max(0, Math.min(score, 100)),
    reasons
  };
}

export const createSkill = async (req, res) => {
  try {
    const skill = await Skill.create({
      owner: req.user.id,
      ...req.body
    });

    res.status(201).json(skill);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find({
      owner: req.user.id
    });

    res.json(skills);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export const updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    res.json(skill);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export const deleteSkill = async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);

    res.json({
      message: "Skill deleted"
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

export const getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const myLearningSkills = (currentUser.learningSkills || []).map((skill) => String(skill.skillName || "").toLowerCase());
    const myTeachingSkills = (currentUser.teachingSkills || []).map((skill) => String(skill.skillName || "").toLowerCase());

    const allUsers = await User.find({ _id: { $ne: currentUser._id } });

    const directMatches = [];
    const partialMatches = [];
    const exploreMatches = [];

    allUsers.forEach((user) => {
      const userTeachingSkills = (user.teachingSkills || []).map((skill) => String(skill.skillName || "").toLowerCase());
      const userLearningSkills = (user.learningSkills || []).map((skill) => String(skill.skillName || "").toLowerCase());

      const theyTeachWhatIWantToLearn = userTeachingSkills.some((skill) => myLearningSkills.includes(skill));
      const theyWantToLearnWhatITeach = userLearningSkills.some((skill) => myTeachingSkills.includes(skill));

      if (theyTeachWhatIWantToLearn && theyWantToLearnWhatITeach) {
        directMatches.push(user.toSafeJSON());
      } else if (theyTeachWhatIWantToLearn || theyWantToLearnWhatITeach) {
        const missingToTeach = theyTeachWhatIWantToLearn && !theyWantToLearnWhatITeach
          ? (user.learningSkills || []).filter((skill) => !myTeachingSkills.includes(String(skill.skillName || "").toLowerCase()))
          : [];

        const missingToLearn = theyWantToLearnWhatITeach && !theyTeachWhatIWantToLearn
          ? (user.teachingSkills || []).filter((skill) => !myLearningSkills.includes(String(skill.skillName || "").toLowerCase()))
          : [];

        partialMatches.push({
          ...user.toSafeJSON(),
          missingToTeach,
          missingToLearn
        });
      } else {
        exploreMatches.push({
          ...user.toSafeJSON(),
          missingToTeach: user.learningSkills || [],
          missingToLearn: user.teachingSkills || []
        });
      }
    });

    res.json({ directMatches, partialMatches, exploreMatches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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

        const match = buildMatchScore(learningSkill, teachingSkill, req.user);

        if (match.score < 55) {
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

export const boostSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, owner: req.user.id });

    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found or unauthorized." });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    skill.isBoosted = true;
    skill.boostActivatedAt = now;
    skill.boostExpiresAt = expiresAt;
    skill.boostPricePaid = req.body.amount || 5.0;
    skill.renewalCount = 0;

    await skill.save();

    res.status(200).json({
      message: `"${skill.skillName}" boosted successfully for 7 days!`,
      skill: {
        ...skill.toObject(),
        boostStatus: skill.getBoostStatus()
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const renewSkillBoost = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, owner: req.user.id });

    if (!skill) {
      return res.status(404).json({ message: "Skill listing not found or unauthorized." });
    }

    const now = new Date();
    const baseDate = skill.boostExpiresAt && new Date(skill.boostExpiresAt) > now
      ? new Date(skill.boostExpiresAt)
      : now;

    const newExpiresAt = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    skill.isBoosted = true;
    skill.boostExpiresAt = newExpiresAt;
    skill.renewalCount = (skill.renewalCount || 0) + 1;

    await skill.save();

    res.status(200).json({
      message: `Boost renewed successfully until ${newExpiresAt.toLocaleDateString()}!`,
      skill: {
        ...skill.toObject(),
        boostStatus: skill.getBoostStatus()
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFeaturedSkills = async (req, res) => {
  try {
    const now = new Date();
    const featuredSkills = await Skill.find({
      type: "teach",
      isBoosted: true,
      boostExpiresAt: { $gt: now }
    })
      .populate("owner", "name email location availability rating totalSwaps")
      .sort({ boostExpiresAt: -1 });

    res.json({
      count: featuredSkills.length,
      skills: featuredSkills
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
