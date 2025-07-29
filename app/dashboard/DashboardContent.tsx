"use client";

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

export default function DashboardContent() {
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Error loading dashboard data</div>
      </div>
    );
  }

  const { metrics, inventoryStatus, pendingTasks, recentActivity } = dashboardData;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Quantum 2.0</h1>
          <p className="text-sm text-gray-600">Inventory Management</p>
        </div>
        
        <nav className="mt-6">
          <div className="px-6 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              MAIN NAVIGATION
            </p>
          </div>
          
          <Link href="/dashboard" className="flex items-center px-6 py-3 text-gray-700 bg-blue-50 border-r-4 border-blue-500">
            <span className="mr-3">📊</span>
            Dashboard
          </Link>
          
          <Link href="/inventory" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">📦</span>
            Inventory
          </Link>
          
          <Link href="/customers" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">👥</span>
            Customers
          </Link>
          
          <Link href="/suppliers" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">🏢</span>
            Suppliers
          </Link>
          
          <Link href="/orders" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">📋</span>
            Orders
          </Link>
          
          <Link href="/purchases" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">🛒</span>
            Purchases
          </Link>
          
          <Link href="/qc" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">✅</span>
            Quality Control
          </Link>
          
          <Link href="/reports" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">📈</span>
            Reports
          </Link>

          <div className="px-6 py-3 mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              OPERATIONS
            </p>
          </div>
          
          <Link href="/goods-in" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">📥</span>
            Goods In
          </Link>
          
          <Link href="/goods-out" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50">
            <span className="mr-3">📤</span>
            Goods Out
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, Admin User</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IMEI Stock</CardTitle>
              <span className="text-2xl">📱</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.imeiStock.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.imeiStock.change} from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Booked Out</CardTitle>
              <span className="text-2xl">📋</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.bookedOut.value}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.bookedOut.percentage}% of total stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending QC</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingQC.value}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.pendingQC.change} from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Returns</CardTitle>
              <span className="text-2xl">↩️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.returns.value}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.returns.change} this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Status */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    In Stock
                  </span>
                  <span className="font-medium">{inventoryStatus.inStock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    Low Stock
                  </span>
                  <span className="font-medium">{inventoryStatus.lowStock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    Out of Stock
                  </span>
                  <span className="font-medium">{inventoryStatus.outOfStock}</span>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Orders to Process</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {pendingTasks.ordersToProcess}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Items to Restock</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                    {pendingTasks.itemsToRestock}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Returns to Process</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                    {pendingTasks.returnsToProcess}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deliveries to Confirm</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {pendingTasks.deliveriesToConfirm}
                  </span>
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
              <div className="grid grid-cols-2 gap-2">
                <Link href="/goods-in">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center text-xs"
                  >
                    <div className="text-lg mb-1">📥</div>
                    Goods In
                  </Button>
                </Link>
                <Link href="/goods-out">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center text-xs"
                  >
                    <div className="text-lg mb-1">📤</div>
                    Goods Out
                  </Button>
                </Link>
                <Link href="/inventory">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center text-xs"
                  >
                    <div className="text-lg mb-1">📦</div>
                    View Inventory
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center text-xs"
                  >
                    <div className="text-lg mb-1">📈</div>
                    View Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
