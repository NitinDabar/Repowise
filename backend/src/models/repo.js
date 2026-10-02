import mongoose  from "mongoose";
const reposchema=new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
         repoUrl: {
            type: String,
            required: true,
            trim: true
        },

        repoName: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);
const Repository=mongoose.model("Repository",reposchema)
export default Repository