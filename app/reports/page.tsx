"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const router = useRouter();

  const reportTypes = [
    {
      title: "Inventory Reports",
      description: "Stock levels, product movement, and inventory valuation",
      reports: [
        "Stock Levels by Location",
        "Low Stock Alert",
        "Inventory Valuation",
        "Product Movement History"
      ]
    },
    {
      title: "Sales Reports",
      description: "Sales performance, customer analysis, and revenue tracking",
      reports: [
        "Daily Sales Summary",
        "Customer Purchase History",
        "Top Selling Products",
        "Revenue by Period"
      ]
    },
    {
      title: "Purchase Reports",
      description: "Supplier performance, purchase analysis, and cost tracking",
      reports: [
        "Purchase Orders by Supplier",
        "Supplier Performance",
        "Purchase Cost Analysis",
        "Returns and Refunds"
      ]
    },
    {
      title: "Quality Control Reports",
      description: "QC statistics, repair tracking, and quality metrics",
      reports: [
        "QC Pass/Fail Rates",
        "Repair Queue Status",
        "Quality Trends",
        "Defect Analysis"
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and view business reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-xl">{category.title}</CardTitle>
              <p className="text-sm text-gray-600">{category.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.reports.map((report, reportIndex) => (
                  <div key={reportIndex} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <span className="font-medium">{report}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Dashboard */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1,243</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">87</div>
              <div className="text-sm text-gray-600">Pending QC</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">34</div>
              <div className="text-sm text-gray-600">Returns</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">156</div>
              <div className="text-sm text-gray-600">Active Orders</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
