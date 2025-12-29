"""
Setup script for Sartor Python SDK
"""

from setuptools import setup, find_packages

setup(
    name="sartor",
    version="0.1.0",
    description="Python SDK for the Sartor Claude Network",
    author="Sartor Claude Network",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
    ],
    extras_require={
        "firebase": ["firebase-admin>=6.0.0"],
        "vector": ["chromadb>=0.4.0", "sentence-transformers>=2.2.0"],
        "dev": ["pytest>=7.0.0", "black>=23.0.0", "mypy>=1.0.0"],
    },
    entry_points={
        "console_scripts": [
            "sartor-queue=sartor.message_queue:main",
            "sartor-agent=sartor.agent_executor:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
