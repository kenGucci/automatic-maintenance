import os
from crewai import Agent, Task, Crew, Process
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(
    model="claude-sonnet-4-20250514",
    anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
    temperature=0.3,
)

coder = Agent(
    role="Senior Coder",
    goal="Write clean, maintainable code and fix issues in the codebase",
    backstory="You are an expert programmer with 15 years of experience in system maintenance tooling.",
    llm=llm,
    verbose=True
)

reviewer = Agent(
    role="Code Reviewer",
    goal="Find bugs, security issues, and code smells in the codebase",
    backstory="You are a detail-oriented reviewer who catches issues others miss.",
    llm=llm,
    verbose=True
)

coding_task = Task(
    description="Review and fix any issues in the maintenance script. Focus on error handling, code quality, and security.",
    agent=coder,
    expected_output="Fixed and improved maintenance script with explanations of changes"
)

review_task = Task(
    description="Review the changes made by the coder. Verify correctness, check for regressions, and suggest any final improvements.",
    agent=reviewer,
    expected_output="Review summary with approved changes and any final recommendations"
)

if __name__ == "__main__":
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY environment variable is required")
        exit(1)
    crew = Crew(agents=[coder, reviewer], tasks=[coding_task, review_task], process=Process.sequential, verbose=2)
    result = crew.kickoff()
    print(result)
