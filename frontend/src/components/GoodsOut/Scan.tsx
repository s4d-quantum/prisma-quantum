import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';

interface SalesOrderItem {
  item_brand: string;
  item_details: string;
  item_color: string;
  item_grade: string;
  item_gb: string;
  quantity: number;
  fulfilled_quantity?: number;
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

interface AddedDevice {
  imei: string;
  brand: string;
  model: string;
  color: string;
  grade: string;
  storage: string;
}

interface ScanQueueItem {
  imei: string;
  timestamp: number;
}

const GoodsOutScan: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannedImei, setScannedImei] = useState("");
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [addedDevices, setAddedDevices] = useState<AddedDevice[]>([]);
  const [processingQueue, setProcessingQueue] = useState<ScanQueueItem[]>([]);
  const [scanningProgress, setScanningProgress] = useState<{ total: number; processed: number }>({ total: 0, processed: 0 });
  
  // Goods out fields
  const [deliveryCompany, setDeliveryCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [totalBoxes, setTotalBoxes] = useState("");
  const [totalPallets, setTotalPallets] = useState("");
  const [poBox, setPoBox] = useState("");
  
  const imeiInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);
  
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(parseInt(orderId));
    }
  }, [orderId]);
  
  useEffect(() => {
    if (imeiInputRef.current) {
      imeiInputRef.current.focus();
    }
  }, []);
  
  // Process scan queue
  useEffect(() => {
    if (processingQueue.length > 0 && !isProcessingRef.current) {
      processNextInQueue();
    }
  }, [processingQueue]);
  
  const fetchOrderDetails = async (orderId: number) => {
    try {
      setLoading(true);
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
  
  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedImei.trim()) return;
    
    // Add to queue immediately
    const queueItem: ScanQueueItem = {
      imei: scannedImei.trim(),
      timestamp: Date.now()
    };
    
    // Update queue and progress
    setProcessingQueue(prev => [...prev, queueItem]);
    setScanningProgress(prev => ({ ...prev, total: prev.total + 1 }));
    
    // Clear input and focus for next scan
    setScannedImei("");
    setScanStatus(`Queued device ${scannedImei.trim()} for scanning...`);
    
    if (imeiInputRef.current) {
      imeiInputRef.current.focus();
    }
  };
  
  const processNextInQueue = async () => {
    if (isProcessingRef.current || processingQueue.length === 0) return;
    
    isProcessingRef.current = true;
    
    const queueItem = processingQueue[0];
    
    try {
      setScanStatus(`Scanning device ${queueItem.imei}...`);
      
      // Fetch device details by IMEI
      const response = await axios.get(`/api/inventory/imei/${queueItem.imei}`, {
        withCredentials: true
      });
      
      const device = response.data.device;
      const manufacturerInfo = response.data.manufacturerInfo;
      const deviceObj = {
        id: 0,
        imei: device.imei,
        brand: manufacturerInfo.brand || 'Unknown',
        model: manufacturerInfo.model || 'Unknown',
        color: device.color,
        grade: device.gradeText,
        storage: device.storage,
        status: device.statusText
      };
      
      // Check if device matches order requirements
      const matchingItems = orderItems.filter(item =>
        item.item_color === deviceObj.color &&
        item.item_grade === deviceObj.grade &&
        item.item_gb === deviceObj.storage &&
        (item.fulfilled_quantity === undefined || item.fulfilled_quantity < item.quantity)
      );
      
      if (matchingItems.length > 0) {
        // Auto-add device if it matches requirements
        await addDeviceToOrder(deviceObj, matchingItems[0]);
        setScanStatus(`Device ${device.imei} automatically added to order`);
      } else {
        setScanStatus(`Device ${device.imei} does not match order requirements`);
      }
    } catch (err: any) {
      console.error('Error scanning device:', err);
      setScanStatus(`Device ${queueItem.imei} not found or error occurred`);
    } finally {
      // Remove from queue and update progress
      setProcessingQueue(prev => prev.slice(1));
      setScanningProgress(prev => ({ ...prev, processed: prev.processed + 1 }));
      isProcessingRef.current = false;
    }
  };
  
  const addDeviceToOrder = async (device: Device, orderItem: SalesOrderItem) => {
    return new Promise<void>((resolve) => {
      // Add device to the added devices list
      const addedDevice: AddedDevice = {
        imei: device.imei,
        brand: device.brand,
        model: device.model,
        color: device.color,
        grade: device.grade,
        storage: device.storage
      };
      
      setAddedDevices(prev => [...prev, addedDevice]);
      
      // Update order items to reflect fulfilled quantity
      setOrderItems(prevItems => {
        return prevItems.map(item => {
          if (
            item.item_color === device.color &&
            item.item_grade === device.grade &&
            item.item_gb === device.storage
          ) {
            return {
              ...item,
              fulfilled_quantity: item.fulfilled_quantity ? item.fulfilled_quantity + 1 : 1
            };
          }
          return item;
        });
      });
      
      resolve();
    });
  };
  
  const handleCompleteOrder = async () => {
    try {
      // Prepare goods out data
      const goodsOutData = {
        deliveryCompany,
        trackingNumber,
        totalBoxes: totalBoxes ? parseInt(totalBoxes) : 0,
        totalPallets: totalPallets ? parseInt(totalPallets) : 0,
        poBox,
        addedDevices // Include the added devices
      };
      
      // Send goods out data along with completion request
      await axios.post(`/api/sales-orders/${orderId}/complete`, goodsOutData, {
        withCredentials: true
      });
      
      navigate('/goods-out');
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Scan Devices for Order #{orderId}</h1>
              <p className="text-gray-600">Scan devices to fulfill this sales order</p>
              {scanningProgress.total > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  Scanned: {scanningProgress.processed}/{scanningProgress.total}
                </div>
              )}
            </div>
            
            {/* Order Summary */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Order Summary</h2>
              </div>
              <div className="p-6">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.fulfilled_quantity ? `${item.fulfilled_quantity}/${item.quantity}` : `0/${item.quantity}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.fulfilled_quantity === item.quantity ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Complete</span>
                              ) : item.fulfilled_quantity && item.fulfilled_quantity > 0 ? (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Partial</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Pending</span>
                              )}
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
              </div>
            </div>
            
            {/* Added Devices */}
            {addedDevices.length > 0 && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-800">Added Devices ({addedDevices.length})</h2>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto max-h-64">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {addedDevices.map((device, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.imei}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.brand}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.model}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.color}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.grade}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.storage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scan Device */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Scan Device</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                    <input
                      ref={imeiInputRef}
                      type="text"
                      placeholder="Enter or scan IMEI"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={scannedImei}
                      onChange={(e) => setScannedImei(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Scan
                    </button>
                  </div>
                </form>
                
                {scanStatus && (
                  <div className={`mt-4 p-3 rounded-md ${
                    scanStatus.includes("added") || scanStatus.includes("Queued") ? 
                    "bg-green-100 text-green-800" : 
                    scanStatus.includes("not found") || scanStatus.includes("error") ? 
                    "bg-red-100 text-red-800" : 
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {scanStatus}
                  </div>
                )}
                
                {/* Processing indicator */}
                {(processingQueue.length > 0) && (
                  <div className="mt-4 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-sm text-gray-600">
                      Processing {processingQueue.length} items in queue...
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Goods Out Information */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Goods Out Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Company</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={deliveryCompany}
                      onChange={(e) => setDeliveryCompany(e.target.value)}
                      placeholder="Enter delivery company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Boxes</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={totalBoxes}
                      onChange={(e) => setTotalBoxes(e.target.value)}
                      placeholder="Enter total boxes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Pallets</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={totalPallets}
                      onChange={(e) => setTotalPallets(e.target.value)}
                      placeholder="Enter total pallets"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Box</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={poBox}
                      onChange={(e) => setPoBox(e.target.value)}
                      placeholder="Enter PO box"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Complete Order */}
            <div className="flex justify-end">
              <button
                onClick={handleCompleteOrder}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Complete Order
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GoodsOutScan;