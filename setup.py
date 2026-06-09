from setuptools import setup, find_packages

with open("README.md", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="automend",
    version="1.0.0",
    description="Autonomous system maintenance agent with AI-powered diagnostics",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/kenGucci/automatic-maintenance",
    author="kenGucci",
    license="ISC",
    packages=find_packages(),
    python_requires=">=3.10",
    install_requires=[
        "flask>=3.0",
        "gunicorn>=22.0",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: System Administrators",
        "License :: OSI Approved :: ISC License",
        "Programming Language :: Python :: 3",
        "Topic :: System :: Monitoring",
        "Topic :: System :: Systems Administration",
    ],
)
