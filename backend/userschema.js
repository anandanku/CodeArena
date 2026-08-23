import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  GoogleId: {
    type: String,
    required: true,
    unique: true
  },
  displayname: {
    type: String,
    required: true
  },
  contest:{
    type:Number,
    default:0
  },
  solved:{
    type:Number,
    default:0
  },
  rating:{
    type:Number,
    default:0
  }
});

export const User = mongoose.model("User", UserSchema);
