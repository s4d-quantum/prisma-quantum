# Device Info API Endpoint

This document describes the implementation of the device info API endpoint that provides detailed information about a device based on its ID or IMEI number.

## Endpoint

```
GET /api/inventory/imei/[id]
```

## Implementation Details

The endpoint has been implemented to handle both database ID and IMEI number lookups in a single route to avoid route conflicts. The route automatically detects whether the parameter is a numeric database ID or an IMEI string:

- For database ID lookups: `/api/inventory/imei/123` (where 123 is the database ID)
- For IMEI lookups: `/api/inventory/imei/359042080162489` (where 359042080162489 is the IMEI number)

### Data Sources

The endpoint fetches information from multiple tables and views:

1. **tbl_imei** - Basic device information
2. **vw_tac** - Manufacturer and model information
3. **vw_device_supplier** - Supplier information
4. **tbl_purchases** - Purchase details
5. **tbl_trays** - Location information
6. **tbl_log** - Movement history
7. **vw_device_overview** - Updated comprehensive device overview (as of 2025-08-14)

### Response Format

The API returns a JSON response with the following structure:

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
    "gradeText": "string",
    "availableFlag": "string"
  },
  "manufacturerInfo": {
    "model": "string",
    "brand": "string"
  },
  "supplier": {
    "name": "string",
    "address": "string",
    "city": "string",
    "country": "string",
    "phone": "string",
    "email": "string",
    "vat": "string"
  },
  "purchase": {
    "purchaseNumber": "number",
    "date": "date",
    "location": "string",
    "locationName": "string",
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

## Updated View Structure

As of 2025-08-14, the `vw_device_overview` view has been updated with additional fields:

- `purchase_date` - The date of the purchase
- `item_cosmetic_passed` - Whether the device passed cosmetic QC
- `item_functional_passed` - Whether the device passed functional QC
- `available_flag` - Whether the device is available for sale ("Available" or "Not Available")
- Enhanced logic for determining device availability based on QC status

## Testing

To test the endpoint:

1. Ensure the Next.js server is running
2. Make a GET request to `/api/inventory/imei/[id]`
3. Replace `[id]` with either a valid database ID or IMEI number

Example test requests:
```javascript
// For database ID lookup
const response1 = await fetch('http://localhost:3000/api/inventory/imei/123');

// For IMEI lookup
const response2 = await fetch('http://localhost:3000/api/inventory/imei/359042080162489');
```

## Error Handling

The endpoint includes proper error handling for:
- Missing parameter
- Device not found
- Database connection issues
- Server errors

Error responses follow the standard format:
```json
{
  "error": "Error message"
}
```

## Route Conflict Resolution

The implementation uses a single route that can handle both database ID and IMEI lookups, eliminating the "You cannot use different slug names for the same dynamic path" error that was occurring with separate routes. The route first attempts to find the device by IMEI, and if not found, falls back to looking up by database ID.