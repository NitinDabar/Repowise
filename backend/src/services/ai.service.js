const ingestRepository = async (repoUrl, repoId) => {
  try {
    const response = await fetch(
      `${process.env.AI_SERVICE_URL}/ingest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          repoUrl,
          repoId
        })
      }
    );

    if (!response.ok) {
      throw new Error("AI ingestion failed");
    }

    return await response.json();

  } catch (error) {
    console.error("AI ingestion error:", error);
    throw error;
  }
};

const askAI = async (question, repoId, conversationId) => {
  try {
    const response = await fetch(
      `${process.env.AI_SERVICE_URL}/ask`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          repoId,
          conversationId
        })
      }
    );

    if (!response.ok) {
      throw new Error("AI service request failed");
    }

    return await response.json();

  } catch (error) {
    console.error("AI service error:", error);
    throw error;
  }
};

export { ingestRepository, askAI };