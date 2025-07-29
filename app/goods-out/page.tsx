"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GoodsOutPage() {
  const router = useRouter();

  const workflowSteps = [
    {
      title: "Sales Orders",
      description: "Process customer orders and allocate inventory",
      icon: "🛍️",
      actions: ["View Pending Orders", "Create Sales Order", "Allocate Stock"]
    },
    {
      title: "Pick & Pack",
      description: "Pick items from inventory and prepare for shipping",
      icon: "📦",
      actions: ["Generate Pick List", "Scan Items", "Pack Orders"]
    },
    {
      title: "Shipping & Delivery",
      description: "Arrange shipping and track deliveries",
      icon: "🚚",
      actions: ["Create Shipping Labels", "Book Courier", "Track Deliveries"]
    },
    {
      title: "Returns Processing",
      description: "Handle customer returns and restocking",
      icon: "↩️",
      actions: ["Process Return", "QC Returned Items", "Restock Items"]
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Goods Out</h1>
        <p className="text-gray-600">Manage outgoing orders and customer deliveries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {workflowSteps.map((step, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{step.icon}</div>
                <div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {step.actions.map((action, actionIndex) => (
                  <Button 
                    key={actionIndex}
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      // TODO: Implement specific workflows
                      console.log(`Action: ${action}`);
                    }}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Goods Out Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">23</div>
              <div className="text-sm text-gray-600">Pending Orders</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">15</div>
              <div className="text-sm text-gray-600">Ready to Ship</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">92</div>
              <div className="text-sm text-gray-600">Shipped Today</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">7</div>
              <div className="text-sm text-gray-600">Returns to Process</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
