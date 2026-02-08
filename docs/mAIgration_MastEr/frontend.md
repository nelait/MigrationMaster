# Frontend Implementation Guide for mAIgration MastEr

This guide provides a detailed frontend implementation plan for the mAIgration MastEr project, focusing on key components, state management, UI/UX guidelines, and code examples to help build the required features.

## 1. Component Structure

The following UI components will be necessary to implement the described features:

- **Login Component**
  - Handles user authentication.
  - Includes forms for username and password.

- **MigrationPathSelector Component**
  - Allows users to select migration paths (e.g., PHP to React).
  - Displays available paths as a dropdown or list.

- **MigrationMainScreen Component**
  - Main interface for managing the migration process.
  - Includes file upload functionality and analysis options.
  - Displays the migration path and current status.

- **CodeAnalysisReport Component**
  - Shows detailed analysis reports including screens, fields, validations, etc.
  - Editable by the user before proceeding.

- **ArtifactEditor Component**
  - Allows users to edit and save generated artifacts.
  - Provides a rich text editor or similar interface.

- **CodeGenerationComponent**
  - Interacts with coding LLMs to generate React code.
  - Shows progress and results.

- **ExplainabilityComponent**
  - Displays explanations for generated code.
  - Offers insights into code logic and structure.

- **TestCaseScriptGenerator Component**
  - Generates and displays test case scripts for validation.

- **EvaluationModule Component**
  - Displays various metrics to evaluate migration quality.
  - Includes charts or tables for visualization.

## 2. State Management

State management is critical for handling the diverse data involved in the migration process. We recommend using a combination of React Context API and hooks for managing global and local states.

- **Global State (using Context API)**
  - **UserState**: Stores user authentication information.
  - **MigrationState**: Manages selected migration path and current status.
  - **ArtifactsState**: Keeps track of generated and edited artifacts.
  - **EvaluationState**: Contains metrics and evaluation results.

- **Local State (using hooks)**
  - **FormData**: For handling form inputs in Login and MigrationPathSelector components.
  - **FileUpload**: Manages uploaded files in MigrationMainScreen.
  - **ReportData**: Stores analysis report data in CodeAnalysisReport.
  - **CodeData**: Holds generated code and explanations in CodeGenerationComponent and ExplainabilityComponent.

## 3. UI/UX Guidelines

- **Consistency**: Maintain a consistent style across components with a unified color scheme and typography.
- **Responsiveness**: Ensure the application is responsive and works well on various screen sizes.
- **Accessibility**: Follow accessibility best practices, including proper labeling and keyboard navigation.
- **Feedback**: Provide users with immediate feedback, such as loading indicators and success messages.
- **Intuitive Navigation**: Design a clear and intuitive navigation flow between components.

## 4. Code Examples

### Login Component

```jsx
import React, { useState } from 'react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Logic for authentication
  };

  return (
    <div className="login-container">
      <input 
        type="text" 
        placeholder="Username" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
      />
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
```

### MigrationPathSelector Component

```jsx
import React, { useContext } from 'react';
import { MigrationContext } from '../context/MigrationContext';

function MigrationPathSelector() {
  const { setMigrationPath } = useContext(MigrationContext);

  const handleSelect = (path) => {
    setMigrationPath(path);
  };

  return (
    <div className="path-selector">
      <h2>Select Migration Path</h2>
      <button onClick={() => handleSelect('PHP to React')}>PHP to React</button>
      {/* Future paths can be added here */}
    </div>
  );
}

export default MigrationPathSelector;
```

### MigrationMainScreen Component

```jsx
import React, { useState } from 'react';

function MigrationMainScreen() {
  const [file, setFile] = useState(null);

  const handleFileUpload = (event) => {
    setFile(event.target.files[0]);
  };

  const handleAnalyze = () => {
    // Logic to analyze uploaded PHP code
  };

  return (
    <div className="migration-main-screen">
      <h1>Migration Path: PHP to React</h1>
      <input type="file" onChange={handleFileUpload} />
      <button onClick={handleAnalyze}>Analyze</button>
    </div>
  );
}

export default MigrationMainScreen;
```

This implementation guide provides a foundation for building the mAIgration MastEr project, focusing on the frontend components, state management strategies, UI/UX principles, and practical code examples for key features.