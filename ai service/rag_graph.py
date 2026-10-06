from typing_extensions import TypedDict
from langgraph.graph import StateGraph,START,END
from langchain_ollama import ChatOllama
from rag import retriever as get_retriever
class iterative(TypedDict):
    question:str
    repo_id:str
    query:str
    context:str
    answer:str
    relevant:bool
    attempts:int

llm=ChatOllama(
    model="qwen2.5:0.5b",
    temperature=0.1
)    
def retrieve(state:iterative):
    retriever=get_retriever(state["repo_id"])
    docs=retriever.invoke(state["query"])
    context="\n\n".join(
        doc.page_content
        for doc in docs
    )
    return {
        "context":context,
        "attempts":state["attempts"]+1
    }
def check_context(state:iterative):
   prompt=f"""
   You are checking whether retrieved code is useful
   for answering the user's question.
   Question:{state["question"]}
   Retrieved context:{state["context"]}
   Is the context relevant enough to answer the question?
   Reply with ONLY:
   YES
   or
   NO
   """
   response=llm.invoke(prompt)
   result=response.content.strip().upper()
   if "YES" in result:
        return {"relevant":True}
   return {
       "relevant":False
   }
def rewrite(state:iterative):
   prompt=f"""
Rewrite the user's question into a better search query
for retrieving relevant source code from a GitHub repository.

Original question:
{state["question"]}

Return ONLY the rewritten search query.
"""
   response=llm.invoke(prompt)
   return{ "query":response.content.strip()}

def generate_ans(state:iterative):
    prompt=f"""
You are an AI assistant that answers questions about
a GitHub repository.

Use ONLY the provided repository context.

If the answer cannot be found in the context,
say:

"I don't know based on the provided code."

Question:
{state["question"]}

Repository context:
{state["context"]}

Give a clear and concise answer.
"""
    response=llm.invoke(prompt)
    return {
        "answer": response.content
    }
def decide(state:iterative):
    if state["relevant"]:
        return "generate"
    if state["attempts"]>=3:
        return "generate"
    return "rewrite"

graph=StateGraph(iterative)
graph.add_node("grade",check_context)
graph.add_node("rewrite",rewrite)
graph.add_node("generate_ans",generate_ans)
graph.add_node("retriever",retrieve)

graph.add_edge(START,"retriever")
graph.add_edge("retriever","grade")
graph.add_conditional_edges("grade",
                            decide,
                            {
                                "generate":"generate_ans",
                                "rewrite":"rewrite"
                            }
                            )
graph.add_edge("rewrite","retriever")
graph.add_edge("generate_ans",END)
rag_app=graph.compile()


     