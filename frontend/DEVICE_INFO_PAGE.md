# Device Info Page Implementation

## Overview
This document describes the implementation of the device info page that displays detailed information about a device when its IMEI is clicked in the inventory table.

## Components

### 1. Backend API Endpoint
- **Endpoint**: `/api/inventory/imei/[imei]/info`
- **Method**: GET
- **Purpose**: Fetch detailed information about a specific device by IMEI

### 2. Frontend Component
- **File**: `src/components/DeviceInfo.tsx`
- **Route**: `/inventory/device/:imei`
- **Purpose**: Display detailed device information in a user-friendly interface

## Implementation Details

### Backend Implementation
The backend API endpoint fetches information from multiple database tables:
1. `tbl_imei` - Core device information
2. `vw_tac` - Manufacturer and model information
3. `vw_device_supplier` - Supplier information
4. `tbl_purchases` - Purchase details
5. `tbl_log` - Movement history

### Frontend Implementation
The frontend component displays all the fetched information in a structured layout with:
1. Device Overview - Basic device information
2. Supplier Information - Supplier details
3. Purchase Information - Purchase details and status
4. Movement History - Table of all device movements

## Navigation Flow
1. User views the inventory table in `/inventory`
2. User clicks on an IMEI number in the table
3. The application navigates to `/inventory/device/:imei`
4. The DeviceInfo component fetches data from the backend API
5. Device information is displayed in a structured layout

## Features
- Clickable IMEI numbers in the inventory table
- Detailed device information display
- Color-coded badges for status and grades
- Responsive design for all screen sizes
- Error handling for missing or invalid devices
- Back navigation to return to the inventory page

## Data Displayed

### Device Overview
- IMEI number
- Manufacturer
- Model
- Color
- Storage capacity
- Status (In Stock/Out of Stock)
- Grade (A-F)
- Purchase ID

### Supplier Information
- Supplier name
- Address
- City
- Country
- Phone number
- Email
- VAT number

### Purchase Information
- Purchase number
- Purchase date
- Location/tray
- QC requirements and completion status
- Repair requirements and completion status
- Priority level
- Comments

### Movement History
- Date
- Subject
- Details
- Reference
- User ID

## Usage
1. Navigate to the inventory page (`/inventory`)
2. Click on any IMEI number in the table
3. View detailed device information on the device info page
4. Use the "Back to Inventory" button to return to the inventory table