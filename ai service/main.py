# import subprocess
# from pathlib import Path
# from langchain_core.documents import Document
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_chroma import Chroma
# from langchain_ollama import ChatOllama
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.messages import HumanMessage,AIMessage
# # clone repo using subprocess
# def clone(repo_url):
#     repo_name=repo_url.strip("/").split("/")[-1].replace(".git","")
#     repo_path=Path("repos")/repo_name
#     repo_path.parent.mkdir(exist_ok=True)
#     subprocess.run(
#         ["git","clone",repo_url,str(repo_path)],
#         check=True
#     )
#     return repo_path
# url=input("Enter your URL")
# repo_path=clone(url)
# print("repo cloned to : ",repo_path)

# # extract required files
# def extract_files(repo_path):
#     allowed_extensions={".py",".js",".java",".jsx",".ts",".tsx",".cpp",".html",".css",".c",".md"}
#     files=[]
#     for file_path in repo_path.rglob("*"):
#         if file_path.is_file() and file_path.suffix in allowed_extensions:
#             files.append(file_path)
#     return files


# files=extract_files(repo_path)
# print("\n files found")
# for file in files:
#     print(file)

# # make docs of file for langchain
# def create_docs(files):
#     documents=[]
#     for file_path in files:
#         try:
#             content=file_path.read_text(encoding="utf-8")
#             document =Document(
#                 page_content=content,
#                 metadata={
#                     "source":str(file_path)
#                 }
#             )   
#             documents.append(document) 
#         except UnicodeDecodeError:
#          print(f"skipping non-text file:{file_path}")
#     return documents     
# documents=create_docs(files)

# # chunking of docs
# def chunk_docs(documents):
#     text_split=RecursiveCharacterTextSplitter(
#         chunk_size=1000,
#         chunk_overlap=200
#     )      
#     split_docs=text_split.split_documents(documents)
#     return split_docs
# split_docs=chunk_docs(documents)
# print("total chunks are:",len(split_docs))

# # make embedding of chunks
# def create_embeddings():
#     embeddings=HuggingFaceEmbeddings(
#         model_name="all-MiniLM-L6-v2"
#     )
#     return embeddings
# embeddings=create_embeddings()

# # db me store
# def create_vectorstore(split_docs,embeddings):
#  vectorstore=Chroma(
#     collection_name="github_code",
#     embedding_function=embeddings,
#     persist_directory=".chroma_db"
#  )
#  vectorstore.add_documents(split_docs)
#  return vectorstore

# vectorstore = create_vectorstore(split_docs, embeddings)
# print("stored in chromadb")

# # retrieve useful chunks
# def create_retriever(vectorstore):
#     retriever=vectorstore.as_retriever(
#         search_kwargs={"k":4}
#     )
#     return retriever
# retriever=create_retriever(vectorstore)
# query=input("ask a question about code")
# docs=retriever.invoke(query)
# for doc in docs:
#     print("\n --source--")
#     print(doc.metadata["source"])
#     print("\n--- CODE ---")
#     print(doc.page_content)

# # llm declare
# def create_llm():
#     llm=ChatOllama(
#         model="llama3.2:3b",
#         temperature=0
#     )    
#     return llm
# llm=create_llm()

# # context prompt
# context_prompt=ChatPromptTemplate.from_messages([
#     (
#         "system",
#         """ you are a quation rewriting assistant
#         Rewrite the users question as a standalone question
#         using the conversation history.
#         Donot answer the question.
#         Rewrite ONLY the rewritten question.
#         If the question is already standalone return it unchanged.
#         """
#     ),
#     (
#         "human",
#         """ {chat_history}
#         Latest question:{question}"""
#     )
# ]
# )
# chain=context_prompt|llm

# def create_rag_chain(llm):
#     final_prompt = ChatPromptTemplate.from_messages([
#         (
#             "system",
#             """You are a code analysis assistant.
# Answer the user's question using the provided
# repository code context.
# Use conversation history only to understand
# references to previous questions.
# Do not invent information.
# If the answer is not present in the provided
# code context, say:
# "I don't know based on the provided code."
# """
#         ),
#         (
#             "human",
#             """Conversation history:
# {chat_history}
# Repository code context:
# {context}
# Current question:
# {question}
# Answer:"""
#         )
#     ])
#     return final_prompt | llm

# rag_chain=create_rag_chain(llm)


# chat_history=[]
# while True:
#     query=input("\n ask question or type 'exit'")
#     if query.lower()=="exit":
#         break
#     history_text=""
#     for message in chat_history:
#         if isinstance(
#             message,HumanMessage
#         ):
#             history_text+=(f"user:{message.content}\n")
#         elif isinstance(message,AIMessage):
#             history_text+=(f"Assistant:{message.content}\n")

#     standalone_q=chain.invoke({"chat_history":history_text,"question":query})
#     standalone_query = standalone_q.content
#     docs=retriever.invoke(standalone_query)
#     context="\n\n".join(
#     doc.page_content
#     for doc in docs 
#     )
#     response=rag_chain.invoke({
#         "chat_history":history_text,
#         "context":context,
#         "question":query
#     })      
#     print(response.content)
#     chat_history.append(HumanMessage(content=query))
#     chat_history.append(AIMessage(content=response.content)) 
    
from fastapi import FastAPI
from pydantic import BaseModel

from rag import ingest_repository
from rag_graph import rag_app


app = FastAPI()


class IngestRequest(BaseModel):
    repoUrl: str
    repoId: str


class AskRequest(BaseModel):
    question: str
    repoId: str
    conversationId: str


@app.post("/ingest")
def ingest(request: IngestRequest):

    try:

        result = ingest_repository(
            request.repoUrl,
            request.repoId
        )

        return {
            "message": "Repository ingested successfully",
            "repoId": request.repoId,
            "result": result
        }

    except Exception as error:

        print("Ingestion error:", error)

        return {
            "message": "Repository ingestion failed",
            "error": str(error)
        }


@app.post("/ask")
def ask_question(request: AskRequest):

    try:

        result = rag_app.invoke({

            "question": request.question,

            "repo_id": request.repoId,

            "query": request.question,

            "context": "",

            "answer": "",

            "relevant": False,

            "attempts": 0
        })

        return {
            "answer": result["answer"],
            "repoId": request.repoId,
            "conversationId": request.conversationId
        }

    except Exception as error:

        print("AI error:", error)

        return {
            "message": "AI request failed",
            "error": str(error)
        }


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )