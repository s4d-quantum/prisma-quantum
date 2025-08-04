import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';

interface Device {
  id: number;
  imei: string;
  color: string;
  storage: string;
  purchaseId: number | null;
  status: number | null;
  statusText: string;
  grade: number | null;
  gradeText: string;
  manufacturer: string;
  model: string;
  trayId: string;
  trayName: string;
}

interface PurchaseOrder {
  purchase_id: number;
  date: string;
  supplier_id: string;
  supplier_name: string;
  qc_required: number;
  priority: number;
  po_ref: string | null;
}

const GoodsInDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPurchaseDetails(parseInt(id));
      fetchDevicesByPurchaseId(parseInt(id));
    }
  }, [id]);

  const fetchPurchaseDetails = async (purchaseId: number) => {
    try {
      // Fetch purchase details directly from the purchases API with purchaseId filter
      const response = await axios.get(`/api/purchases`, {
        params: {
          purchaseId: purchaseId.toString()
        },
        withCredentials: true
      });
      
      if (response.data.purchases && response.data.purchases.length > 0) {
        // Get the first purchase with matching purchase_id
        const purchase = response.data.purchases.find((p: any) => p.purchase_id === purchaseId);
        
        if (purchase) {
          // Get supplier name
          const supplierName = purchase.supplier?.name || purchase.supplier_id || 'N/A';
          
          // Format the purchase order data to match our interface
          const purchaseOrderData: PurchaseOrder = {
            purchase_id: purchase.purchase_id,
            date: purchase.date,
            supplier_id: purchase.supplier_id,
            supplier_name: supplierName,
            qc_required: purchase.qc_required || 0,
            priority: purchase.priority || 1,
            po_ref: purchase.po_ref || null
          };
          
          setPurchaseOrder(purchaseOrderData);
        } else {
          setError('Purchase order not found');
        }
      } else {
        setError('Purchase order not found');
      }
    } catch (err: any) {
      console.error('Error fetching purchase details:', err);
      setError('Failed to fetch purchase details. Please try again later.');
    }
  };

  const fetchDevicesByPurchaseId = async (purchaseId: number) => {
    try {
      setLoading(true);
      const response = await axios.get<Device[]>(`/api/inventory/imei/purchase/${purchaseId}`, {
        withCredentials: true,
        timeout: 15000
      });
      
      setDevices(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      if (err.response?.status === 404) {
        setError('No devices found for this purchase order');
      } else {
        setError('Failed to fetch devices. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: number) => {
    const priorityClasses = [
      'bg-gray-100 text-gray-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800'
    ];
    
    const priorityLabels = [
      'Low',
      'Medium',
      'High',
      'Very High',
      'Critical'
    ];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${priorityClasses[priority - 1] || 'bg-gray-100 text-gray-800'}`}>
        {priorityLabels[priority - 1] || `Priority ${priority}`}
      </span>
    );
  };

  const getQcBadge = (qcRequired: number) => {
    if (qcRequired === 1) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Yes</span>;
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">No</span>;
    }
  };

  const getGradeBadge = (gradeText: string) => {
    const gradeColors: { [key: string]: string } = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'E': 'bg-red-100 text-red-800',
      'F': 'bg-purple-100 text-purple-800',
    };
    
    const colorClass = gradeColors[gradeText] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 ${colorClass} rounded-full text-xs font-medium`}>
        {gradeText}
      </span>
    );
  };

  const getStatusBadge = (statusText: string) => {
    if (statusText === "In Stock") {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">In Stock</span>;
    } else if (statusText === "Out of Stock") {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Out of Stock</span>;
    } else {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Unknown</span>;
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
          <button
            onClick={() => navigate('/goods-in')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Goods In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Purchase Order Details</h1>
                  <p className="text-gray-600">View details for purchase order #{id}</p>
                </div>
                <button
                  onClick={() => navigate('/goods-in')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Back to Goods In
                </button>
              </div>
            </div>

            {/* Purchase Order Summary Card */}
            {purchaseOrder && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-800">Order Summary</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Purchase ID</h3>
                      <p className="mt-1 text-sm text-gray-900 font-medium">#{purchaseOrder.purchase_id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(purchaseOrder.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {purchaseOrder.supplier_name || purchaseOrder.supplier_id}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">PO Reference</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {purchaseOrder.po_ref || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">QC Required</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {getQcBadge(purchaseOrder.qc_required)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {getPriorityBadge(purchaseOrder.priority)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Device Count</h3>
                      <p className="mt-1 text-sm text-gray-900">{devices.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Devices Table */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Devices in Order</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devices.length > 0 ? (
                      devices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/inventory/device/${device.imei}`)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                            {device.imei}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.manufacturer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.color}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getGradeBadge(device.gradeText)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.storage}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.trayName}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No devices found for this purchase order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GoodsInDetail;