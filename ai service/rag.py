import subprocess
from pathlib import Path
import shutil
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
BASE_DIR=Path(__file__).resolve().parent
REPO_DIR=BASE_DIR/"repos"
CHROMA_DIR=BASE_DIR/"chroma_db"
ALLOWED_EXTENSIONS={
    ".py",".cpp",".js",".jsx",".tsx",".java",".html",".css",".ts",".c",".md",
}
embeddings=HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)
vectorstore=Chroma(
    collection_name="github_code",
    embedding_function=embeddings,
    persist_directory=str(CHROMA_DIR)
)
def clone(repo_url:str,repo_id:str):
    repo_path=REPO_DIR/repo_id
    if repo_path.exists():
        shutil.rmtree(repo_path)
    REPO_DIR.mkdir(exist_ok=True)
    subprocess.run(
        ["git","clone",repo_url,str(repo_path)],
        check=True
    )    
    return repo_path

def load_repo(repo_path:Path,repo_id:str):
    documents=[]
    for file_path in repo_path.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue
        if any (
            part in{
               "node_modules",
                ".git",
                "__pycache__",
                ".venv",
                "venv",
                "dist",
                "build" 
            }
            for part in file_path.parts
        ):
            continue
        try:
            content = file_path.read_text(
                encoding="utf-8",errors="ignore"
            )
            documents.append(
                Document(
                    page_content=content,
                    metadata={
                        "source":str(file_path),
                        "repo_id":repo_id
                    }
                )
            )
        except Exception as e:
            print(f"could not read {file_path}:{e}")

    return documents

def chunking(documents):
    splitter=RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    return splitter.split_documents(documents)

def ingest_repository(repo_url:str,repo_id:str):
    repo_path=clone(repo_url,repo_id)
    documents = load_repo(repo_path,repo_id )
    chunks=chunking(documents)
    vectorstore.add_documents(chunks)

    return {
        "repo_id": repo_id,
        "files": len(documents),
        "chunks": len(chunks)
        }

def retriever(repo_id:str):
    retrieve=vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k":5,
            "fetch_k":30,
            "lambda_mult":0.5,
            "filter":{
                "repo_id":repo_id
            }
        }
    ) 
    return retrieve
     