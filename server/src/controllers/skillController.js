import { Skill } from "../models/Skill.js";

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