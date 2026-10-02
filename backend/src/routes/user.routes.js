import express from "express"
import jwtverify from "../middlewares/jwtverify.middleware.js"
import { registeruser ,loginuser,logoutuser} from "../controllers/user.controller.js"
const router=express.Router();
router.post("/register",registeruser);
router.post("/login",loginuser);
router.post("/logout",jwtverify,logoutuser)
export default router