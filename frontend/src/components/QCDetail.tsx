import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useNavigate, useParams } from 'react-router-dom';

interface Device {
  imei: string;
  model_no: string;
  color: string;
  storage: string;
  grade: string;
  cosmetic: string;
  functional: string;
  fault: string;
  spec: string;
  comments: string;
}

const QCDetail: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const navigate = useNavigate();
  const { purchaseId } = useParams<{ purchaseId: string }>();
  
  useEffect(() => {
    if (purchaseId) {
      fetchDevices(parseInt(purchaseId));
    }
  }, [purchaseId]);

  const fetchDevices = async (id: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/qc/purchases/${id}/devices`, {
        withCredentials: true
      });
      
      setDevices(response.data.devices);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      setError('Failed to fetch devices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    try {
      // Create CSV content
      let csvContent = 'IMEI,Model/Details,Color,GB,Grade,Cosmetic,Functional,Fault,Spec,Comments\n';
      
      devices.forEach((device) => {
        csvContent += `${device.imei || ''},${device.model_no || ''},${device.color || ''},${device.storage || ''},${device.grade || ''},${device.cosmetic || ''},${device.functional || ''},${device.fault || ''},${device.spec || ''},${device.comments || ''}\n`;
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `qc_export_${purchaseId}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export to Excel. Please try again later.');
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
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <button 
                onClick={() => navigate('/qc')}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
              >
                <span className="mr-2">←</span> Back to QC
              </button>
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">QC Details</h1>
                  <p className="text-gray-600">Purchase Order ID: {purchaseId}</p>
                </div>
                <button
                  onClick={handleExportToExcel}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Devices Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Devices in Purchase Order</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model/Details</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GB</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cosmetic</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Functional</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fault</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spec</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devices.length > 0 ? (
                      devices.map((device, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.imei}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.model_no}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.color}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.storage}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.grade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.cosmetic}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.functional}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.fault}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.spec}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.comments}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                          No devices found
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

export default QCDetail;