import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import userroutes from "./routes/user.routes.js"
import reporoutes from "./routes/repo.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

dotenv.config();
const app=express()
app.use(cors())
app.use(express.json())
connectDB();
app.get("/",(req,res)=>{
    res.json({
        message:"github rag backend is running"
    });
});
app.use("/api/users",userroutes)
app.use("/api/repo",reporoutes)
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
const port=process.env.PORT||3000;
app.listen(port,()=>{
    console.log(`server is running om port ${port}`);
});
