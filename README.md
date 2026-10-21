# RepoWise 🔍

**An AI-Powered GitHub Repository Code Assistant**

RepoWise helps developers understand, explore, and ask questions about GitHub repositories using Retrieval-Augmented Generation (RAG). It retrieves relevant source code and uses an LLM to generate context-aware answers.

Instead of manually searching through multiple files, developers can ask natural-language questions about a codebase and receive answers grounded in the retrieved source code.

## ✨ Features

- **GitHub Repository Ingestion:** Clone a repository and prepare its source code for retrieval.
- **Intelligent Code Retrieval:** Retrieve relevant code chunks using vector similarity search.
- **AI-Powered Q&A:** Ask natural-language questions about a codebase.
- **Repository-Aware Retrieval:** Filter retrieval results to the selected repository.
- **RAG Pipeline:** Combine retrieved source code with an LLM to generate contextual answers.
- **Graph-Based Workflow:** Use LangGraph to organize retrieval and answer generation.
- **REST API Integration:** Connect the frontend, backend, and AI service through API endpoints.

## 🏗️ Architecture

```text
                 ┌──────────────────────┐
                 │    React + Vite      │
                 │      Frontend        │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │   Express / Node.js  │
                 │     Backend API      │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │    FastAPI Service   │
                 │   /ask  |  /ingest   │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │    LangGraph + RAG   │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │  ChromaDB Vector DB  │
                 └──────────────────────┘
```

## ⚙️ How It Works

### 1. Repository Ingestion

1. Accept a GitHub repository URL.
2. Clone the repository.
3. Extract relevant source files.
4. Split the source code into smaller chunks.
5. Generate embeddings for the chunks.
6. Store the embeddings and repository metadata in ChromaDB.

### 2. Question Answering

1. The user submits a question about the repository.
2. The AI service retrieves relevant code chunks from ChromaDB.
3. Repository metadata filters the results to the selected codebase.
4. LangGraph orchestrates retrieval and response generation.
5. The LLM generates an answer using the retrieved code as context.
6. The answer is returned to the frontend.

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| AI Service | Python, FastAPI |
| AI Workflow | LangGraph, LangChain |
| Retrieval | Retrieval-Augmented Generation (RAG) |
| Vector Database | ChromaDB |
| Embeddings | Configured embedding model |
| Version Control | Git, GitHub |

## 🧠 RAG Pipeline

RepoWise uses a RAG workflow to answer questions about source code.

1. **Load:** Read relevant repository files.
2. **Chunk:** Divide code into manageable chunks.
3. **Embed:** Convert chunks into vector representations.
4. **Store:** Save vectors and metadata in ChromaDB.
5. **Retrieve:** Search for relevant chunks when a question is asked.
6. **Generate:** Pass the retrieved context to the LLM to generate an answer.

Repository identifiers and source-file metadata help associate retrieved chunks with the correct codebase.


## 🎯 Goal

RepoWise aims to simplify codebase exploration by combining semantic code search with LLM-powered explanations, helping developers understand unfamiliar repositories more efficiently.

---

**Built with React, Node.js, FastAPI, LangGraph, and ChromaDB.**
