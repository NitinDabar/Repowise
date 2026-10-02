import express from "express";
import verifyjwt from "../middlewares/jwtverify.middleware.js";
import { createMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.post("/", verifyjwt, createMessage);

export default router;