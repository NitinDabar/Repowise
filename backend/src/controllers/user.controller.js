import User from "../models/user.js"
import jwt from "jsonwebtoken"
const registeruser=async(req,res)=>{
    const {name,email,password}=req.body;
    if(!name||!email||!password){
        return res.status(400).json({
            message:"all feilds are required"
        });
    }
    const existing =await User.findOne({email});
    if(existing){
        return res.status(409).json({
            message:"user already exists"
        })
    }
    const user=await User.create({
        name,email,password
    });
    return res.status(201).json({
        message:"user regustered successfully",
        user:{
            id:user._id,
            name:user.name,
            email:user.email
        }
    })
}
const loginuser=async(req,res)=>{
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({
            message:"all feilds are required"
        })
    }
    const isuser=await User.findOne({email});
    if(!isuser){
        return res.status(400).json({
            message:"user not found"
        })
    }
    if(isuser.password!==password){
         return res.status(401).json({
                message:"invalid password"
            });
    }
    const token=jwt.sign({
        id:isuser._id,
        email:isuser.email
    },process.env.JWT_SECRET,{
        expiresIn:"1d"
    });
    return res.status(200).json({
            message: "login successful",
            token,
            isuser: {
                id: isuser._id,
                name: isuser.name,
                email: isuser.email
            }
        });
}
const logoutuser=async(req,res)=>{
    return res.status(200).json({
        message:"user logged out successfully"
    });
}
export {registeruser,loginuser,logoutuser}