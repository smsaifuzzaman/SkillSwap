import { Skill } from "../models/Skill.js";
import { User } from "../models/User.js";

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

export const getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const myLearningSkills = currentUser.learningSkills.map(s => s.skillName.toLowerCase());
    const myTeachingSkills = currentUser.teachingSkills.map(s => s.skillName.toLowerCase());

    const allUsers = await User.find({ _id: { $ne: currentUser._id } });

    const directMatches = [];
    const partialMatches = [];
    const exploreMatches = [];

    allUsers.forEach(user => {
      const userTeachingSkills = user.teachingSkills.map(s => s.skillName.toLowerCase());
      const userLearningSkills = user.learningSkills.map(s => s.skillName.toLowerCase());

      const theyTeachWhatIWantToLearn = userTeachingSkills.some(skill => myLearningSkills.includes(skill));
      const theyWantToLearnWhatITeach = userLearningSkills.some(skill => myTeachingSkills.includes(skill));

      if (theyTeachWhatIWantToLearn && theyWantToLearnWhatITeach) {
        directMatches.push(user.toSafeJSON());
      } else if (theyTeachWhatIWantToLearn || theyWantToLearnWhatITeach) {
        const missingToTeach = theyTeachWhatIWantToLearn && !theyWantToLearnWhatITeach 
          ? user.learningSkills.filter(s => !myTeachingSkills.includes(s.skillName.toLowerCase()))
          : [];

        const missingToLearn = theyWantToLearnWhatITeach && !theyTeachWhatIWantToLearn
          ? user.teachingSkills.filter(s => !myLearningSkills.includes(s.skillName.toLowerCase()))
          : [];

        partialMatches.push({
          ...user.toSafeJSON(),
          missingToTeach,
          missingToLearn
        });
      } else {
        exploreMatches.push({
          ...user.toSafeJSON(),
          missingToTeach: user.learningSkills,
          missingToLearn: user.teachingSkills
        });
      }
    });

    res.json({ directMatches, partialMatches, exploreMatches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};