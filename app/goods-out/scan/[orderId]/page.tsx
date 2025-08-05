"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";


interface SalesOrderItem {
  item_brand: string;
  item_details: string;
  item_color: string;
  item_grade: string;
  item_gb: string;
  quantity: number;
}
interface Device {
  id: number;
  imei: string;
  brand: string;
  model: string;
  color: string;
  grade: string;
  storage: string;
  status: string;
}

export default function ScanDevicesPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.orderId;
  
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannedImei, setScannedImei] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(parseInt(orderId));
    }
  }, [orderId]);

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setLoading(true);
      // Fetch order items from the sales orders API
      const response = await axios.get(`/api/sales-orders/${orderId}`, {
        withCredentials: true
      });
      
      setOrderItems(response.data.items);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedImei) return;

    try {
      setScanStatus("Scanning...");
      
      // Fetch device details by IMEI
      const response = await axios.get(`/api/inventory/imei/${scannedImei}`, {
        withCredentials: true
      });
      
      const device = response.data.device;
      const manufacturerInfo = response.data.manufacturerInfo;
      const deviceObj = {
        id: 0, // ID isn't provided in the response but we don't actually use it
        imei: device.imei,
        brand: manufacturerInfo.brand || 'Unknown',
        model: manufacturerInfo.model || 'Unknown',
        color: device.color,
        grade: device.gradeText,
        storage: device.storage,
        status: device.statusText
      };
      setSelectedDevice(deviceObj);
      setScanStatus(null);
      
      // Check if device matches order requirements
      const matchingItems = orderItems.filter(item =>
        item.item_color === deviceObj.color &&
        item.item_grade === deviceObj.grade &&
        item.item_gb === deviceObj.storage &&
        item.quantity > 0
      );
      
      if (matchingItems.length > 0) {
        setScanStatus("Device matches order requirements");
      } else {
        setScanStatus("Device does not match order requirements or no items remaining");
      }
    } catch (err: any) {
      console.error('Error scanning device:', err);
      setScanStatus("Device not found or error occurred");
      setSelectedDevice(null);
    }
  };

  const handleConfirmDevice = async () => {
    if (!selectedDevice || !orderId) return;

    try {
      // Find the first matching order item that has quantity > 0
      const matchingItem = orderItems.find(item =>
        item.item_color === selectedDevice.color &&
        item.item_grade === selectedDevice.grade &&
        item.item_gb === selectedDevice.storage &&
        item.quantity > 0
      );
      
      if (!matchingItem) {
        setScanStatus("No matching order item found");
        return;
      }
      
      // For now, we'll just show a success message since we don't have individual item IDs
      // In a real implementation, you would need to track which specific items have been scanned
      setScannedImei("");
      setSelectedDevice(null);
      setScanStatus("Device confirmed and added to order");
      
      // Refresh order details
      fetchOrderDetails(parseInt(orderId));
      setScannedImei("");
      setSelectedDevice(null);
    } catch (err: any) {
      console.error('Error confirming device:', err);
      setScanStatus("Error confirming device");
    }
  };

  const handleCompleteOrder = async () => {
    try {
      // Mark order as completed
      await axios.post(`/api/sales-orders/${orderId}/complete`, {}, {
        withCredentials: true
      });
      
      // Redirect to goods out page
      router.push('/goods-out');
    } catch (err: any) {
      console.error('Error completing order:', err);
      setScanStatus("Error completing order");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Scan Devices for Order #{orderId}</h1>
        <p className="text-gray-600">Scan devices to fulfill this sales order</p>
      </div>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderItems.length > 0 ? (
                  orderItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_brand}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_details}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_color}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_grade}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_gb}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No items found for this order
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Scan Device */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scan Device</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
              <input
                type="text"
                placeholder="Enter or scan IMEI"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={scannedImei}
                onChange={(e) => setScannedImei(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit">
                Scan
              </Button>
            </div>
          </form>

          {scanStatus && (
            <div className={`mt-4 p-3 rounded-md ${scanStatus.includes("matches") ? "bg-green-100 text-green-800" : scanStatus.includes("not found") || scanStatus.includes("error") ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
              {scanStatus}
            </div>
          )}

          {selectedDevice && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-medium mb-2">Device Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">IMEI:</span> {selectedDevice.imei}
                </div>
                <div>
                  <span className="font-medium">Brand:</span> {selectedDevice.brand}
                </div>
                <div>
                  <span className="font-medium">Model:</span> {selectedDevice.model}
                </div>
                <div>
                  <span className="font-medium">Color:</span> {selectedDevice.color}
                </div>
                <div>
                  <span className="font-medium">Grade:</span> {selectedDevice.grade}
                </div>
                <div>
                  <span className="font-medium">Storage:</span> {selectedDevice.storage}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedDevice.status}
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleConfirmDevice}>
                  Confirm and Add to Order
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Order */}
      <div className="flex justify-end">
        <Button onClick={handleCompleteOrder} className="bg-green-600 hover:bg-green-700">
          Complete Order
        </Button>
      </div>
    </div>
  );
}