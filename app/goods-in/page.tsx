"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GoodsInPage() {
  const router = useRouter();

  const workflowSteps = [
    {
      title: "Receive Purchase Orders",
      description: "Process incoming purchase orders from suppliers",
      icon: "📋",
      actions: ["View Pending POs", "Create New PO", "Update PO Status"]
    },
    {
      title: "Add IMEI Products",
      description: "Register new IMEI products into the system",
      icon: "📱",
      actions: ["Bulk IMEI Import", "Single IMEI Entry", "TAC Database Lookup"]
    },
    {
      title: "Quality Control",
      description: "Perform QC checks on received products",
      icon: "🔍",
      actions: ["Start QC Process", "View QC Queue", "QC Reports"]
    },
    {
      title: "Stock Assignment",
      description: "Assign products to stock locations and trays",
      icon: "📦",
      actions: ["Assign to Tray", "Update Location", "Generate Labels"]
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Goods In</h1>
        <p className="text-gray-600">Manage incoming inventory and purchase orders</p>
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
          <CardTitle>Goods In Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Pending Purchase Orders</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">87</div>
              <div className="text-sm text-gray-600">Items Awaiting QC</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">156</div>
              <div className="text-sm text-gray-600">Items Processed Today</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Items Requiring Repair</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
