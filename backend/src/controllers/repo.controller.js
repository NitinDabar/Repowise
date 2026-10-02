import Repository from "../models/repo.js";
import { ingestRepository } from "../services/ai.service.js";
const createRepository = async (req, res) => {
  try {
    const { repoUrl, repoName } = req.body;
    const userId = req.user.id;

    if (!repoUrl || !repoName) {
      return res.status(400).json({
        message: "repoUrl and repoName are required"
      });
    }

    const existingRepo = await Repository.findOne({
      userId,
      repoUrl
    });

    if (existingRepo) {
      return res.status(409).json({
        message: "repository already exists"
      });
    }

    // 1. Repository MongoDB mein create
    const repository = await Repository.create({
      userId,
      repoUrl,
      repoName
    });

    // 2. MongoDB-generated _id Python ko bhejo
    const aiResult = await ingestRepository(
      repoUrl,
      repository._id.toString()
    );

    return res.status(201).json({
      message: "Repository created and ingested successfully",
      repository,
      ai: aiResult
    });

  } catch (error) {
    console.error("create repository error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getrepos=async(req,res)=>{
    try {
        const userId=req.user.id;
        const repos=await Repository.find({
            userId
        }).sort({createdAt:-1});
        return res.status(200).json({
            message:"Repositories fetched successfully",
            repos
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"internal server error"
        });
        
    }
}

export { createRepository ,getrepos};
