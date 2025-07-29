"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Link from "next/link";

interface DashboardMetrics {
  imeiStock: {
    value: number;
    change: string;
    label: string;
  };
  bookedOut: {
    value: string;
    percentage: number;
    change: string;
    label: string;
  };
  pendingQC: {
    value: number;
    change: string;
    label: string;
  };
  returns: {
    value: number;
    change: string;
    label: string;
  };
}

interface InventoryStatus {
  inStock: number;
  lowStock: number;
  outOfStock: number;
  total: number;
  inStockPercentage: number;
  lowStockPercentage: number;
  outOfStockPercentage: number;
}

interface PendingTasks {
  ordersToProcess: number;
  itemsToRestock: number;
  returnsToProcess: number;
  deliveriesToConfirm: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  itemCode: string;
  time: Date;
}

interface DashboardData {
  metrics: DashboardMetrics;
  inventoryStatus: InventoryStatus;
  pendingTasks: PendingTasks;
  recentActivity: RecentActivity[];
}

export default function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("/api/dashboard");
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const formatTime = (time: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(time).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex">
        <div className="w-64 bg-blue-600 text-white min-h-screen">
          <div className="p-4">
            <h2 className="text-xl font-bold">Quantum 2.0</h2>
          </div>
          <nav className="mt-8">
            <Link href="/dashboard" className="block px-4 py-2 bg-blue-700 hover:bg-blue-800">
              📊 Dashboard
            </Link>
            <Link href="/inventory" className="block px-4 py-2 hover:bg-blue-700">
              📦 Inventory
            </Link>
            <Link href="/sales-orders" className="block px-4 py-2 hover:bg-blue-700">
              🛍️ Sales Orders
            </Link>
            <Link href="/purchases" className="block px-4 py-2 hover:bg-blue-700">
              🛒 Purchase Orders
            </Link>
            <Link href="/customers" className="block px-4 py-2 hover:bg-blue-700">
              👥 Customers
            </Link>
            <Link href="/suppliers" className="block px-4 py-2 hover:bg-blue-700">
              🏭 Suppliers
            </Link>
            <Link href="/goods-in" className="block px-4 py-2 hover:bg-blue-700">
              📥 Goods In
            </Link>
            <Link href="/goods-out" className="block px-4 py-2 hover:bg-blue-700">
              📤 Goods Out
            </Link>
            <Link href="/qc-repairs" className="block px-4 py-2 hover:bg-blue-700">
              🔧 QC & Repairs
            </Link>
            <Link href="/reports" className="block px-4 py-2 hover:bg-blue-700">
              📈 Reports
            </Link>
            <Link href="/settings" className="block px-4 py-2 hover:bg-blue-700">
              ⚙️ Settings
            </Link>
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-sm">
              <div>Admin User</div>
              <div className="text-xs text-blue-200">admin@example.com</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">
                  {dashboardData.metrics.imeiStock.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {dashboardData.metrics.imeiStock.value.toLocaleString()}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {dashboardData.metrics.imeiStock.change} from last month
                </div>
                <div className="text-xs text-gray-500">total imei units inventory</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  {dashboardData.metrics.bookedOut.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {dashboardData.metrics.bookedOut.value}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {dashboardData.metrics.bookedOut.change} from last month
                </div>
                <div className="text-xs text-gray-500">units sold vs in stock</div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">
                  {dashboardData.metrics.pendingQC.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {dashboardData.metrics.pendingQC.value}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {dashboardData.metrics.pendingQC.change} from last month
                </div>
                <div className="text-xs text-gray-500">units awaiting quality control</div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  {dashboardData.metrics.returns.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {dashboardData.metrics.returns.value}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {dashboardData.metrics.returns.change} from last month
                </div>
                <div className="text-xs text-gray-500">total units returned</div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <div className="text-xl font-semibold mb-2">Sales Analytics</div>
                  <div className="text-gray-500">Sales and purchases data visualization would render here</div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{activity.type}</div>
                        <div className="text-xs text-gray-500">{activity.description}</div>
                        {activity.itemCode && (
                          <div className="text-xs text-blue-600">{activity.itemCode}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(activity.time)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Status */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">In Stock ({dashboardData.inventoryStatus.inStockPercentage}%)</span>
                    </div>
                    <span className="font-semibold">{dashboardData.inventoryStatus.inStock.toLocaleString()} Items</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${dashboardData.inventoryStatus.inStockPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Low Stock ({dashboardData.inventoryStatus.lowStockPercentage}%)</span>
                    </div>
                    <span className="font-semibold">{dashboardData.inventoryStatus.lowStock} Items</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${dashboardData.inventoryStatus.lowStockPercentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Out of Stock ({dashboardData.inventoryStatus.outOfStockPercentage}%)</span>
                    </div>
                    <span className="font-semibold">{dashboardData.inventoryStatus.outOfStock} Items</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${dashboardData.inventoryStatus.outOfStockPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <span className="text-sm">Orders to Process</span>
                    <span className="font-semibold text-orange-600">{dashboardData.pendingTasks.ordersToProcess}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm">Items to Restock</span>
                    <span className="font-semibold text-blue-600">{dashboardData.pendingTasks.itemsToRestock}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm">Returns to Process</span>
                    <span className="font-semibold text-red-600">{dashboardData.pendingTasks.returnsToProcess}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm">Deliveries to Confirm</span>
                    <span className="font-semibold text-green-600">{dashboardData.pendingTasks.deliveriesToConfirm}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="h-20 flex flex-col items-center justify-center text-xs"
                    onClick={() => router.push("/inventory/imei/add")}
                  >
                    <div className="text-lg mb-1">📱</div>
                    New Product
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center text-xs"
                    onClick={() => router.push("/orders/new")}
                  >
                    <div className="text-lg mb-1">📋</div>
                    New Order
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center text-xs"
                    onClick={() => router.push("/inventory")}
                  >
                    <div className="text-lg mb-1">📊</div>
                    Manage Stock
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center text-xs"
                    onClick={() => router.push("/reports")}
                  >
                    <div className="text-lg mb-1">📈</div>
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
