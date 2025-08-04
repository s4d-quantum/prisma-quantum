# Device Info Page Architecture

## Overview
This document describes the architecture for implementing a device info page that displays detailed information about a device when its IMEI number is clicked in the inventory table. The solution consists of a backend API endpoint that provides all necessary device information.

## System Architecture

### Backend API Endpoint
- **Endpoint**: `/api/inventory/imei/[imei]/info`
- **Method**: GET
- **Purpose**: Fetch detailed information about a specific device by IMEI

### Data Sources
1. **tbl_imei** - Core device information
2. **vw_tac** - Manufacturer and model information (view)
3. **vw_device_supplier** - Supplier information (view)
4. **tbl_purchases** - Purchase details
5. **tbl_log** - Device movement history

## Implementation Plan

### 1. Prisma Schema Updates
Add view models to the Prisma schema:

```prisma
model vw_tac {
  item_tac     String? @db.VarChar(100)
  item_details String? @db.VarChar(100)
  brand_title  String? @db.VarChar(100)

  @@id([item_tac])
}

model vw_device_supplier {
  item_imei      String? @db.VarChar(100)
  supplier_name  String? @db.VarChar(100)

  @@id([item_imei])
}
```

### 2. API Endpoint Implementation
Create the file at `app/api/inventory/imei/[imei]/info/route.ts` with the following functionality:

#### Data to Fetch:
1. **Device Information** (from `tbl_imei`):
   - IMEI no (item_imei)
   - Color (item_color)
   - Storage (item_gb)
   - P.ID no (purchase_id)
   - Status (status column, 1= in stock, 0= out of stock)
   - Grade (1 = A, 2 = B, 3 = C, 4 = D, 5 = E, 6 = F, 0 = N/A)

2. **Manufacturer and Model Information** (from `vw_tac`):
   - Using item_tac from tbl_imei
   - item_details (model)
   - brand_title (manufacturer)

3. **Supplier Information** (from `vw_device_supplier`):
   - Matched by item_imei
   - supplier_name

4. **Purchase Information** (from `tbl_purchases`):
   - Date (date)
   - Location (tray_id, maps in tbl_trays)
   - QC Required? (qc_required 0 = no, 1 = yes)
   - QC Completed? (qc_completed 0 = no, 1 = yes)
   - Repair Required? (repair_required 0 = no, 1 = yes)
   - Repair Completed? (repair_completed 0 = no, 1 = yes)
   - Purchase Return? (purchase_return 0 = no, 1 = yes)
   - Priority (priority 1 to 5 where 5 is highest)
   - Comments (report_comment)

5. **Movement Logs** (from `tbl_log`):
   - All records where item_code matches the device IMEI
   - Should include: date, subject, details, ref, auto_time, user_id

### 3. Response Format
```json
{
  "device": {
    "imei": "string",
    "color": "string",
    "storage": "string",
    "purchaseId": "number",
    "status": "number",
    "statusText": "string",
    "grade": "number",
    "gradeText": "string"
  },
  "manufacturerInfo": {
    "model": "string",
    "brand": "string"
  },
  "supplier": {
    "name": "string"
  },
  "purchase": {
    "date": "date",
    "location": "string",
    "qcRequired": "boolean",
    "qcCompleted": "boolean",
    "repairRequired": "boolean",
    "repairCompleted": "boolean",
    "purchaseReturn": "boolean",
    "priority": "number",
    "comments": "string"
  },
  "movements": [
    {
      "id": "number",
      "date": "date",
      "subject": "string",
      "details": "string",
      "ref": "string",
      "autoTime": "date",
      "userId": "number"
    }
  ]
}
```

## Frontend Integration
The frontend (handled separately in the React+Vite project) will:
1. Call the API endpoint when a device IMEI is clicked
2. Display all the information in a user-friendly format
3. Show the movement history in a table

## Error Handling
The API will handle:
- Device not found (404)
- Invalid IMEI parameter (400)
- Database errors (500)
- General server errors (500)

## Security Considerations
- Authentication/authorization checks
- IMEI parameter validation
- Rate limiting to prevent abuse

## Testing
- Valid IMEI test
- Invalid IMEI test
- Missing IMEI test
- Error handling test

## Deployment
- Ensure database views exist
- Verify Prisma schema is updated
- Test in staging environment
- Monitor error logs after deployment