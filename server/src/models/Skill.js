import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
{
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    skillName:{
        type:String,
        required:true
    },

    type:{
        type:String,
        enum:["teach","learn"],
        required:true
    },

    proficiency:{
        type:String,
        enum:["Beginner","Intermediate","Advanced","Expert"],
        required:true
    },

    sessionDuration:{
        type:Number,
        default:60
    },

    preferredFormat:{
        type:String,
        enum:["Online","Offline","Hybrid"],
        default:"Online"
    },

    description:{
        type:String,
        default:""
    }
},
{
    timestamps:true
}
);

export const Skill = mongoose.model("Skill",skillSchema);