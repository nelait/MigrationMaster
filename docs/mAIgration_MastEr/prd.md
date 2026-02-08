# Project Requirements Document (PRD) for mAIgration MastEr

## 1. Introduction

The mAIgration MastEr is a tool designed to facilitate the migration of projects from one technology to another, commencing with the migration path from PHP to React. The tool aims to streamline the transition by providing a comprehensive suite of features including code analysis, artifact generation, and automated code rewriting using coding Language Learning Models (LLMs). Users will be able to upload their PHP code, analyze it, and generate necessary artifacts and React code with the help of AI, while also having the ability to edit and save these artifacts. Additional features include GitHub integration, explainability, test case generation, and an evaluation module to assess migration quality.

## 2. Product Specifications

### Features

1. **Login Module**
   - Secure user authentication system to access the tool.

2. **Migration Path Selection**
   - Users can select the migration path; initially limited to PHP to React.
   - Future paths can be added as needed.

3. **Migration Path Main Screen**
   - **File Upload**: Users upload PHP code for migration.
   - **Analyze Button**: Initiates the code analysis process.

4. **Code Analysis and Artifact Generation**
   - Generates comprehensive code analysis reports including:
     - Screens
     - Fields
     - Validations
     - APIs
     - Database objects
     - Queries
     - Data models
     - Business logic
     - Test cases
     - Sequence diagrams
     - Component diagrams
     - Architecture diagrams
   - Artifacts are generated to facilitate the rewrite of the application in React.

5. **Artifact Editing and Saving**
   - Users can edit and save the generated artifacts before proceeding with code rewriting.

6. **Code Generation Using LLMs**
   - Utilizes coding LLMs to generate React code, ensuring dynamic and contextual code creation rather than relying solely on templates.

7. **GitHub Integration**
   - Ability to push generated artifacts and code to a GitHub repository for version control and collaboration.

8. **Explainability Feature**
   - Provides explanations for the generated code to enhance understanding and facilitate learning.

9. **Test Case Script Generation**
   - Automated generation of test case scripts to validate the accuracy and completeness of the migration.

10. **Evaluation Module**
    - Offers an evaluation of the migration quality using various metrics, potentially with the help of additional LLMs.

## 3. User Experience

- **Login and Authentication**: Users will begin by securely logging into the system. A user-friendly interface will guide them through this process.
  
- **Migration Path Selection**: After logging in, users will choose the desired migration path (currently PHP to React), which will take them to the main migration screen.

- **Main Migration Screen**:
  - Users will upload their PHP code using a straightforward file upload interface.
  - Upon clicking the "Analyze" button, users will receive a detailed analysis and a suite of generated artifacts.

- **Artifact Interaction**:
  - Users can review, edit, and save the artifacts. The interface will be intuitive to allow easy editing and saving.

- **Code Generation and Explanation**:
  - A dedicated section will display the generated React code with explanations available to enhance user understanding.

- **GitHub Integration**:
  - Users will have the option to push their artifacts and code to GitHub through a simple, guided process.

- **Test and Evaluation**:
  - Test cases will be readily available, and the evaluation module will provide insights on migration quality, helping users assess the success of the migration.

## 4. Implementation Requirements

- **Technical Stack**:
  - Frontend: React (for user interface)
  - Backend: Node.js or similar server-side technology
  - Database: Relational or NoSQL database for user data and file storage
  - Authentication: OAuth or similar secure authentication system
  - LLM Integration: APIs to connect with coding LLMs for code generation and evaluation

- **Artifact Generation**:
  - Utilize tools or libraries capable of parsing PHP code and extracting the necessary components for analysis and artifact generation.

- **Code Generation**:
  - Implement APIs to interact with coding LLMs to facilitate the dynamic generation of React code.

- **Version Control**:
  - GitHub API integration for pushing and managing code repositories.

- **Explainability and Evaluation**:
  - Develop or integrate existing tools to provide code explainability and migration evaluation metrics.

- **Security Considerations**:
  - Ensure secure data handling and storage practices, particularly for user credentials and uploaded code. 

This PRD outlines the essential components of the mAIgration MastEr project, providing a foundation for the development and implementation of the tool. Further refinement and expansion of features may be undertaken as the project evolves.