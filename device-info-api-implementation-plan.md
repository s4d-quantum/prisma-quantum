# Device Info API Implementation Plan

## Overview
This document outlines the implementation steps for creating a new API endpoint to fetch detailed device information based on IMEI number. The endpoint will be accessible at `/api/inventory/imei/[imei]/info`.

## Implementation Steps

### 1. Create Directory Structure
Create the following directory structure:
```
app/api/inventory/imei/[imei]/info/
```

### 2. Create API Route File
Create the file:
```
app/api/inventory/imei/[imei]/info/route.ts
```

### 3. Implement the GET Endpoint

#### 3.1. Import Required Modules
```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
```

#### 3.2. Initialize Prisma Client
```typescript
const prisma = new PrismaClient();
```

#### 3.3. Implement GET Function
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { imei: string } }
) {
  try {
    // Get the IMEI from params
    const { imei } = params;
    
    // Validate IMEI parameter
    if (!imei) {
      return NextResponse.json(
        { error: "IMEI parameter is required" },
        { status: 400 }
      );
    }
    
    // Fetch device information from tbl_imei
    const device = await prisma.tbl_imei.findUnique({
      where: { item_imei: imei }
    });
    
    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }
    
    // Fetch manufacturer and model information from vw_tac
    const manufacturerInfo = await prisma.vw_tac.findUnique({
      where: { item_tac: device.item_tac }
    });
    
    // Fetch supplier information from vw_device_supplier
    const supplier = await prisma.vw_device_supplier.findUnique({
      where: { item_imei: imei }
    });
    
    // Fetch purchase information from tbl_purchases
    const purchase = await prisma.tbl_purchases.findFirst({
      where: { item_imei: imei }
    });
    
    // Fetch movement logs from tbl_log
    const movements = await prisma.tbl_log.findMany({
      where: { item_code: imei },
      orderBy: { date: 'desc' }
    });
    
    // Format the response
    const response = {
      device: {
        imei: device.item_imei,
        color: device.item_color,
        storage: device.item_gb,
        purchaseId: device.purchase_id,
        status: device.status,
        statusText: device.status === 1 ? "In Stock" : "Out of Stock",
        grade: device.item_grade,
        gradeText: getGradeText(device.item_grade)
      },
      manufacturerInfo: {
        model: manufacturerInfo?.item_details || null,
        brand: manufacturerInfo?.brand_title || null
      },
      supplier: {
        name: supplier?.supplier_name || null
      },
      purchase: purchase ? {
        date: purchase.date,
        location: purchase.tray_id,
        qcRequired: purchase.qc_required === 1,
        qcCompleted: purchase.qc_completed === 1,
        repairRequired: purchase.repair_required === 1,
        repairCompleted: purchase.repair_completed === 1,
        purchaseReturn: purchase.purchase_return === 1,
        priority: purchase.priority,
        comments: purchase.report_comment
      } : null,
      movements: movements.map(log => ({
        id: log.id,
        date: log.date,
        subject: log.subject,
        details: log.details,
        ref: log.ref,
        autoTime: log.auto_time,
        userId: log.user_id
      }))
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Device info API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch device information" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

#### 3.4. Helper Function for Grade Text
```typescript
function getGradeText(grade: number | null): string {
  if (grade === null || grade === 0) return "N/A";
  
  const gradeMap: { [key: number]: string } = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F"
  };
  
  return gradeMap[grade] || "N/A";
}
```

### 4. Complete Implementation Code

The complete implementation file should look like this:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getGradeText(grade: number | null): string {
  if (grade === null || grade === 0) return "N/A";
  
  const gradeMap: { [key: number]: string } = {
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
    6: "F"
  };
  
  return gradeMap[grade] || "N/A";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { imei: string } }
) {
  try {
    // Get the IMEI from params
    const { imei } = params;
    
    // Validate IMEI parameter
    if (!imei) {
      return NextResponse.json(
        { error: "IMEI parameter is required" },
        { status: 400 }
      );
    }
    
    // Fetch device information from tbl_imei
    const device = await prisma.tbl_imei.findUnique({
      where: { item_imei: imei }
    });
    
    if (!device) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }
    
    // Fetch manufacturer and model information from vw_tac
    const manufacturerInfo = await prisma.vw_tac.findUnique({
      where: { item_tac: device.item_tac }
    });
    
    // Fetch supplier information from vw_device_supplier
    const supplier = await prisma.vw_device_supplier.findUnique({
      where: { item_imei: imei }
    });
    
    // Fetch purchase information from tbl_purchases
    const purchase = await prisma.tbl_purchases.findFirst({
      where: { item_imei: imei }
    });
    
    // Fetch movement logs from tbl_log
    const movements = await prisma.tbl_log.findMany({
      where: { item_code: imei },
      orderBy: { date: 'desc' }
    });
    
    // Format the response
    const response = {
      device: {
        imei: device.item_imei,
        color: device.item_color,
        storage: device.item_gb,
        purchaseId: device.purchase_id,
        status: device.status,
        statusText: device.status === 1 ? "In Stock" : "Out of Stock",
        grade: device.item_grade,
        gradeText: getGradeText(device.item_grade)
      },
      manufacturerInfo: {
        model: manufacturerInfo?.item_details || null,
        brand: manufacturerInfo?.brand_title || null
      },
      supplier: {
        name: supplier?.supplier_name || null
      },
      purchase: purchase ? {
        date: purchase.date,
        location: purchase.tray_id,
        qcRequired: purchase.qc_required === 1,
        qcCompleted: purchase.qc_completed === 1,
        repairRequired: purchase.repair_required === 1,
        repairCompleted: purchase.repair_completed === 1,
        purchaseReturn: purchase.purchase_return === 1,
        priority: purchase.priority,
        comments: purchase.report_comment
      } : null,
      movements: movements.map(log => ({
        id: log.id,
        date: log.date,
        subject: log.subject,
        details: log.details,
        ref: log.ref,
        autoTime: log.auto_time,
        userId: log.user_id
      }))
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Device info API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch device information" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
```

## Testing Plan

### 1. Test with Valid IMEI
- Send a GET request to `/api/inventory/imei/123456789012345/info`
- Verify that all device information is returned correctly
- Check that all related data (manufacturer, supplier, purchase, movements) is included

### 2. Test with Invalid IMEI
- Send a GET request to `/api/inventory/imei/invalid-imei/info`
- Verify that a 404 error is returned

### 3. Test with Missing IMEI
- Send a GET request to `/api/inventory/imei//info`
- Verify that a 400 error is returned

### 4. Test Error Handling
- Temporarily disconnect the database
- Send a GET request to `/api/inventory/imei/123456789012345/info`
- Verify that a 500 error is returned

## Deployment Considerations

1. Ensure the database views `vw_tac` and `vw_device_supplier` exist in the database
2. Verify that the Prisma schema includes these views
3. Test the endpoint in a staging environment before deploying to production
4. Monitor error logs after deployment to catch any issues