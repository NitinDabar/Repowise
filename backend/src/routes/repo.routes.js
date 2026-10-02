import express from "express";
import { createRepository,getrepos } from "../controllers/repo.controller.js";
import verifyjwt from "../middlewares/jwtverify.middleware.js";
const router = express.Router();
router.post("/",verifyjwt ,createRepository);
router.get("/",verifyjwt ,getrepos);

export default router;