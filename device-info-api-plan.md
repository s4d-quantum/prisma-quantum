# Device Info API Endpoint Plan

## Overview
This document outlines the implementation plan for creating a new API endpoint to fetch detailed device information based on IMEI number. The endpoint will be accessible at `/api/inventory/imei/[imei]/info`.

## Prisma Schema Updates

### 1. Add vw_tac View
We need to add a view model for `vw_tac` to the Prisma schema to fetch manufacturer and model information:

```prisma
model vw_tac {
  item_tac     String? @db.VarChar(100)
  item_details String? @db.VarChar(100)
  brand_title  String? @db.VarChar(100)

  @@id([item_tac])
}
```

### 2. Add vw_device_supplier View
We need to add a view model for `vw_device_supplier` to the Prisma schema to fetch supplier information:

```prisma
model vw_device_supplier {
  item_imei      String? @db.VarChar(100)
  supplier_name  String? @db.VarChar(100)

  @@id([item_imei])
}
```

## API Endpoint Implementation

### File Location
The new API endpoint should be created at:
```
app/api/inventory/imei/[imei]/info/route.ts
```

### Required Data Fetching

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

### Response Format
The API should return a JSON response with the following structure:

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

### Implementation Steps

1. Create the directory structure for the new endpoint:
   ```
   app/api/inventory/imei/[imei]/info/
   ```

2. Create the route file:
   ```
   app/api/inventory/imei/[imei]/info/route.ts
   ```

3. Implement the GET endpoint:
   - Fetch device information from tbl_imei
   - Fetch manufacturer/model info from vw_tac
   - Fetch supplier info from vw_device_supplier
   - Fetch purchase info from tbl_purchases
   - Fetch movement logs from tbl_log
   - Combine all data into the response format
   - Implement proper error handling

4. Test the endpoint with sample data

## Error Handling

The API should handle the following error cases:
- Device not found (404)
- Database connection errors (500)
- Invalid IMEI format (400)
- General server errors (500)

## Security Considerations

- Ensure proper authentication/authorization checks
- Validate IMEI parameter to prevent injection attacks
- Implement rate limiting to prevent abuse