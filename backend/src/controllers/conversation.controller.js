import Conversation from "../models/conversation.js";
import Repository from "../models/repo.js";

const createConversation = async (req, res) => {
  try {
    const { repoId, title } = req.body;

    // JWT middleware se user id milegi
    const userId = req.user.id;

    if (!repoId) {
      return res.status(400).json({
        message: "repoId is required"
      });
    }

    // Check karo ki ye repo isi logged-in user ki hai
    const repository = await Repository.findOne({
      _id: repoId,
      userId
    });

    if (!repository) {
      return res.status(404).json({
        message: "Repository not found"
      });
    }

    // Conversation create
    const conversation = await Conversation.create({
      userId,
      repoId,
      title: title || "New Conversation"
    });

    return res.status(201).json({
      message: "Conversation created successfully",
      conversation
    });

  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

export { createConversation };