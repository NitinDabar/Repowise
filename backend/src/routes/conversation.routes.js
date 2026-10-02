import express from "express";
import verifyjwt from "../middlewares/jwtverify.middleware.js";
import { createConversation } from "../controllers/conversation.controller.js";

const router = express.Router();

router.post("/", verifyjwt, createConversation);

export default router;