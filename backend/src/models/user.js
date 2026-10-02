import mongoose from "mongoose";
const userschema=new mongoose.Schema(
    {
        name:{
            required:true,
            type:String,
            trim:true  
        },
          email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
    
);
const User=mongoose.model("User",userschema)
export default User;