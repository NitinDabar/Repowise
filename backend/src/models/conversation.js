import mongoose  from "mongoose";
const convoschema=new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
         repoId: {
           type:mongoose.Schema.Types.ObjectId,
            ref:"Repository",
            trim: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);
const Conversation=mongoose.model("Conversation",convoschema)
export default Conversation