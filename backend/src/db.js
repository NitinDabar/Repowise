import mongoose from "mongoose";
const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connect db");
        
    }catch(error){
        console.log("error in connecting db");
        console.log(error)
        process.exit(1);
    }
};
export default connectDB;