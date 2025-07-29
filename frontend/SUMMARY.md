# Inventory Management Frontend - Summary

## Overview

This is a React + Vite frontend for the inventory management system that connects to an existing MySQL database through a Next.js backend API.

## Features Implemented

1. **Main Dashboard Page**
   - Navigation sidebar with links to all sections
   - Responsive layout that works on different screen sizes
   - Modern sleek design with Tailwind CSS
   - User profile section with logout functionality

2. **Inventory Page**
   - Table view of devices from tbl_imei
   - Search and filtering capabilities
   - Pagination for large datasets
   - Enhanced data display with:
     - IMEI number
     - Status (In Stock / Out of Stock)
     - Storage capacity
     - Color
     - Grade information (from tbl_grades)
     - Manufacturer and model information (from tbl_tac and tbl_categories)

3. **Authentication**
   - Login page with email/password authentication
   - Session management with token storage
   - Protected routes that require authentication

4. **Routing**
   - React Router for client-side navigation
   - Responsive sidebar that collapses on mobile

## Technical Details

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Inventory.tsx
│   │   ├── Login.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── AppRoutes.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── assets/
│   └── App.tsx
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

### API Integration
The frontend communicates with the backend API endpoints:
- `/api/inventory/imei` - Get IMEI inventory data with enhanced information
- `/api/auth/callback/credentials` - Authentication endpoint

### Styling
- Tailwind CSS for styling
- Responsive design
- Modern color scheme with blue as primary color
- Card-based layout with shadows and rounded corners
- Hover effects and transitions for interactive elements

## Testing Instructions

### Prerequisites
1. Backend server (Next.js application) running on port 3000
2. Node.js and npm installed
3. MySQL database with tbl_imei table and related tables

### Running the Application
1. Start the backend server:
   ```bash
   cd ../
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```bash
   cd frontend/
   npm install
   npm run dev
   ```

3. Open your browser to http://localhost:3001

### Testing API Connectivity
Run the test script to verify the frontend can communicate with the backend:
```bash
npm run test:setup
```

## Future Enhancements

1. Add form for adding new devices to inventory
2. Implement edit functionality for existing devices
3. Add data export capabilities (CSV, Excel)
4. Implement advanced filtering and sorting
5. Add real-time updates with WebSocket integration
6. Implement role-based access control
7. Add data visualization with charts and graphs
8. Implement offline support with service workers