# Inventory Management Frontend

This is a React + Vite frontend for the inventory management system.

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- The backend server running (Next.js application)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root of the frontend directory with the following content:
   ```
   VITE_API_URL=http://localhost:3000/api
   VITE_BASE_URL=http://localhost:3000
   ```

## Running the Application

1. Start the backend server (Next.js application) on port 3000:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:3001

## Testing the Setup

To test if the frontend can communicate with the backend:

1. Ensure the backend server is running on port 3000
2. Run the test script:
   ```bash
   npm run test:setup
   ```

This will verify that the frontend can successfully make API requests to the backend.

## Building for Production

To create a production build:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Project Structure

- `src/` - Source code for the frontend application
- `src/components/` - React components
- `src/context/` - React context providers
- `src/assets/` - Static assets (images, icons, etc.)
- `src/App.tsx` - Main application component
- `src/main.tsx` - Entry point
- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

## Features

- Dashboard with inventory statistics
- Inventory management with search and filtering
- Responsive design using Tailwind CSS
- Authentication with login/logout functionality
- Navigation sidebar with links to different sections