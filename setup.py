from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="yami-ai",
    version="0.1.0",
    author="YAMI Project",
    description="Assistente de IA Pessoal Visual e por Voz",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/seu-usuario/yami",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Development Status :: 3 - Alpha",
        "Intended Audience :: End Users/Desktop",
        "Topic :: Home Automation",
        "Topic :: Communications",
    ],
    python_requires=">=3.10",
    install_requires=[
        "openai>=0.27.0",
        "python-dotenv>=0.19.0",
        "pydantic>=1.10.0",
        "PyAudio>=0.2.11",
        "pydub>=0.25.0",
        "SpeechRecognition>=3.10.0",
        "pyttsx3>=2.90",
        "PyQt6>=6.2.0",
        "matplotlib>=3.5.0",
        "SQLAlchemy>=2.0.0",
        "FastAPI>=0.95.0",
        "uvicorn>=0.21.0",
        "requests>=2.28.0",
    ],
    entry_points={
        "console_scripts": [
            "yami=src.main:main",
        ],
    },
)
