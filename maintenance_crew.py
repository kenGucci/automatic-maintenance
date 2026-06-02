from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

coder = Agent(role="Senior Coder", goal="Write clean code", backstory="Expert programmer", llm=llm, verbose=True)
reviewer = Agent(role="Code Reviewer", goal="Find bugs", backstory="Detail-oriented reviewer", llm=llm, verbose=True)

task = Task(description="Review and fix any issues in the maintenance script", agent=coder, expected_output="Fixed code")

crew = Crew(agents= , tasks= , process=Process.sequential, verbose=2)
result = crew.kickoff()
print(result)
