import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface DeviceInfo {
  device: {
    imei: string;
    color: string;
    storage: string;
    purchaseId: number | null;
    status: number | null;
    statusText: string;
    grade: number | null;
    gradeText: string;
  };
  manufacturerInfo: {
    model: string | null;
    brand: string | null;
  };
  supplier: {
    name: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    vat: string | null;
  };
  purchase: {
    purchaseNumber: number;
    date: string;
    location: string | null;
    locationName: string | null;
    qcRequired: boolean;
    qcCompleted: boolean;
    repairRequired: boolean;
    repairCompleted: boolean;
    purchaseReturn: boolean;
    priority: number | null;
    comments: string | null;
  } | null;
  movements: Array<{
    id: number;
    date: string;
    subject: string;
    details: string;
    ref: string;
    autoTime: string;
    userId: number | null;
  }>;
}

const DeviceInfo: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (imei) {
      fetchDeviceInfo(imei);
    }
  }, [imei]);

  const fetchDeviceInfo = async (imei: string) => {
    try {
      setLoading(true);
      const response = await axios.get<DeviceInfo>(`/api/inventory/imei/${imei}`, {
        withCredentials: true,
        timeout: 15000 // 15 second timeout
      });
      
      setDeviceInfo(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching device info:', err);
      if (err.response?.status === 404) {
        setError('Device not found');
      } else if (err.response?.status === 400) {
        setError('Invalid IMEI provided');
      } else {
        setError('Failed to fetch device information. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
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

  const getBooleanBadge = (value: boolean, trueText: string = "Yes", falseText: string = "No") => {
    return value ? 
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{trueText}</span> :
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">{falseText}</span>;
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
            onClick={() => navigate('/inventory')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  if (!deviceInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Device Information</h2>
          <button
            onClick={() => navigate('/inventory')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Inventory
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
                </div>
                <button
                  onClick={() => navigate('/inventory')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Back to Inventory
                </button>
              </div>
            </div>

            {/* Device Overview Card */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Device Overview</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">IMEI</h3>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{deviceInfo.device.imei}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Manufacturer</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.manufacturerInfo.brand || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Model</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.manufacturerInfo.model || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {getStatusBadge(deviceInfo.device.statusText)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Color</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.device.color || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Storage</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.device.storage || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Grade</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {getGradeBadge(deviceInfo.device.gradeText)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Purchase ID</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.device.purchaseId || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Information Card */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Supplier Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.supplier.name || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.supplier.address || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">City</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.supplier.city || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Country</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.supplier.country || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.supplier.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.supplier.email || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">VAT</h3>
                    <p className="mt-1 text-sm text-gray-900">{deviceInfo.supplier.vat || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Information Card */}
            {deviceInfo.purchase && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-800">Purchase Information</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Purchase Number</h3>
                      <p className="mt-1 text-sm text-gray-900">{deviceInfo.purchase.purchaseNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(deviceInfo.purchase.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {deviceInfo.purchase.locationName || deviceInfo.purchase.location || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                      <p className="mt-1 text-sm text-gray-900">{deviceInfo.purchase.priority || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">QC Required</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {getBooleanBadge(deviceInfo.purchase.qcRequired)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">QC Completed</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {getBooleanBadge(deviceInfo.purchase.qcCompleted)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Repair Required</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {getBooleanBadge(deviceInfo.purchase.repairRequired)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Repair Completed</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {getBooleanBadge(deviceInfo.purchase.repairCompleted)}
                      </p>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                      <h3 className="text-sm font-medium text-gray-500">Comments</h3>
                      <p className="mt-1 text-sm text-gray-900">{deviceInfo.purchase.comments || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Movement History Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Movement History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deviceInfo.movements.length > 0 ? (
                      deviceInfo.movements.map((movement) => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(movement.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.details}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.ref}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {movement.userId || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No movement history found
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

export default DeviceInfo;