import Message from "../models/message.js";
import Conversation from "../models/conversation.js";
import { askAI } from "../services/ai.service.js";

const createMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    const userId = req.user.id;

    if (!conversationId || !content) {
      return res.status(400).json({
        message: "conversationId and content are required"
      });
    }

    // Check conversation belongs to logged-in user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    // Save user message
    const userMessage = await Message.create({
      conversationId,
      role: "user",
      content
    });

    // Ask AI
    const aiResponse = await askAI(
      content,
      conversation.repoId.toString(),
      conversationId.toString()
    );
   console.log("AI RESPONSE:", aiResponse);
    // Save AI message
    const assistantMessage = await Message.create({
      conversationId,
      role: "assistant",
      content: aiResponse.answer
    });

    return res.status(201).json({
      message: "Message processed successfully",
      userMessage,
      assistantMessage
    });

  } catch (error) {
    console.error("Create message error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export { createMessage };