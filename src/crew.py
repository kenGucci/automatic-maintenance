import os
from crewai import Agent, Task, Crew, Process
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model=os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-20250514"),
    anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
    temperature=0.3,
)

researcher = Agent(
    role='Senior Researcher',
    goal='Find accurate and up-to-date information about deployment best practices',
    backstory='You are an expert researcher with deep knowledge of DevOps and system deployment.',
    llm=llm,
    verbose=True
)

task1 = Task(
    description='Research about CrewAI deployment process. Find the best practices for deploying CrewAI agents in production environments.',
    expected_output='A detailed summary of the deployment requirements, infrastructure recommendations, and best practices.',
    agent=researcher
)

crew = Crew(
    agents=[researcher],
    tasks=[task1],
    process=Process.sequential,
    verbose=True
)

def run():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY environment variable is required")
        return
    result = crew.kickoff()
    print(result)

if __name__ == "__main__":
    run()
