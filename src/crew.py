from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool

search_tool = SerperDevTool()

researcher = Agent(
    role='Senior Researcher',
    goal='Find accurate and up-to-date information',
    backstory='You are an expert researcher.',
    tools= ,
    verbose=True
)

task1 = Task(
    description='Research about CrewAI deployment process.',
    expected_output='A detailed summary of the deployment requirements.',
    agent=researcher
)

crew = Crew(
    agents= ,
    tasks= ,
    process=Process.sequential,
    verbose=True
)

def run():
    result = crew.kickoff()
    print(result)
