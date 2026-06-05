from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool

search_tool = SerperDevTool()

researcher = Agent(
    role='Senior Researcher',
    goal='Find accurate and up-to-date information about deployment best practices',
    backstory='You are an expert researcher with deep knowledge of DevOps and system deployment.',
    tools=[search_tool],
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
    result = crew.kickoff()
    print(result)
