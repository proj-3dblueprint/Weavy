# Weavy App Source Code Analysis Project

*Created: October 28, 2025*  
*Last Updated: October 28, 2025*

This project contains manually downloaded source files from the Weavy web application for educational and reverse engineering purposes.

## Project Overview

Weavy is a "Pro-grade design workflows, Powered by any AI model" platform. This repository serves as a learning resource to understand the architecture, implementation, and technologies used in building a modern React-based design workflow application.

## Source Files

The source files were manually downloaded from `https://app.weavy.ai/flow/i1duC9kjnRBvtFTQrecSqh` as a logged-in user. The download includes:

### Fully Downloaded Directories
- **`assets/`** - Static assets (CSS, JS, images, etc.)
- **`flow/`** - Flow-related files and configurations
- **`src/`** - Complete React application source code

### Partially Downloaded
- **`src/UI/Icons/`** - Some icons downloaded, not complete

### Placeholders
- **`icons/`** - Empty directory placeholder
- **`menu-images/`** - Empty directory placeholder
- **`node_modules/`** - Contains only specific packages needed for analysis:
  - `@react-three/` - Three.js React integration packages
  - `@floating-ui/` - Floating UI components
  - `@descope/` - Authentication SDK packages
  - Other folders are empty placeholders

## File Tree References

This project includes two critical reference files that represent the **exact file structure** from the original Weavy application:

- **`file-tree-node_modules.md`** - Complete node_modules structure
- **`file-tree-src.md`** - Complete src directory structure

These files were created by:
1. Taking screenshots of the file tree from the Weavy application
2. Using LLM analysis to generate initial structure
3. Manual verification and editing to ensure 100% accuracy

**Important:** These file tree references are the **source of truth** for the correct folder/file ordering as they appear in the original application. The actual folders in this project contain the real downloaded files but may not maintain the exact same ordering due to IDE/file system organization.

## Purpose & Goals

This project enables:

1. **Code Analysis** - Study real-world React application architecture
2. **Reverse Engineering** - Understand how Weavy implements design workflows
3. **Learning** - Explore modern web development patterns and technologies
4. **Technology Research** - Investigate the tech stack and implementation details

## Technology Stack (Based on Analysis)

From the downloaded files, Weavy appears to use:

- **Frontend**: React with TypeScript
- **3D Graphics**: Three.js (@react-three/fiber, @react-three/drei)
- **UI Components**: Custom component library
- **Authentication**: Descope SDK
- **Styling**: CSS modules/custom styling
- **Build Tools**: Vite (based on asset structure)
- **State Management**: Custom state management solutions
- **API Integration**: Axios for HTTP requests

## Project Structure

```
weavy-app/
├── assets/                 # Static assets (fully downloaded)
├── flow/                   # Flow configurations (fully downloaded)
├── src/                    # React app source (fully downloaded)
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── state/             # State management
│   ├── types/             # TypeScript definitions
│   ├── utils/             # Utility functions
│   └── ...
├── icons/                  # Placeholder (empty)
├── menu-images/           # Placeholder (empty)
├── node_modules/          # Selective downloads
├── file-tree-node_modules.md  # Reference: exact node_modules structure
├── file-tree-src.md       # Reference: exact src structure
└── README.md             # This file
```

## Usage Notes

### File Organization
- **Downloaded folders** contain actual source files from Weavy
- **Placeholder folders** are empty and serve as structural references
- **File tree .md files** show the exact original structure and ordering

### Development Setup
This is not intended as a runnable project. The selective downloads and placeholders prevent full functionality. Use this for:

- Code reading and analysis
- Understanding architecture patterns
- Learning from production React code
- Reverse engineering specific features

### Future Updates
The project will be updated as more files are downloaded from Weavy, with corresponding updates to the file tree references.