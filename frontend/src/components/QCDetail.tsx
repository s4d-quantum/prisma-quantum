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

interface EditableDevice extends Device {
  editedColor: string;
  editedGrade: string;
  editedCosmetic: string;
  editedFunctional: string;
  editedComments: string;
}

interface PurchaseOrder {
  id: number;
  purchase_id: number;
  date: string;
  supplier: {
    name: string;
  } | null;
  qc_completed: number;
}

const QCDetail: React.FC = () => {
  const [devices, setDevices] = useState<EditableDevice[]>([]);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [qcCompleted, setQcCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
      
      setPurchaseOrder(response.data.purchaseOrder);
      
      // Convert devices to editable format
      const editableDevices = response.data.devices.map((device: Device) => ({
        ...device,
        editedColor: device.color || '',
        editedGrade: device.grade || 'A',
        editedCosmetic: device.cosmetic || 'Pending',
        editedFunctional: device.functional || 'Pending',
        editedComments: device.comments || ''
      }));
      
      setDevices(editableDevices);
      
      // Set QC completion status from purchase order
      setQcCompleted(response.data.purchaseOrder?.qc_completed === 1);
      
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
      let csvContent = 'IMEI,Model/Details,Color,GB,Grade,Cosmetic,Functional,Comments\n';
      
      devices.forEach((device) => {
        csvContent += `${device.imei || ''},${device.model_no || ''},${device.color || ''},${device.storage || ''},${device.grade || ''},${device.cosmetic || ''},${device.functional || ''},${device.comments || ''}\n`;
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

  const handleDeviceChange = (index: number, field: string, value: string) => {
    const updatedDevices = [...devices];
    updatedDevices[index] = { ...updatedDevices[index], [`edited${field}`]: value };
    setDevices(updatedDevices);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      
      // Prepare data for submission
      const submissionData = devices.map(device => ({
        imei: device.imei,
        color: device.editedColor,
        grade: device.editedGrade,
        cosmetic: device.editedCosmetic === 'Passed' ? 1 : device.editedCosmetic === 'Failed' ? 0 : null,
        functional: device.editedFunctional === 'Passed' ? 1 : device.editedFunctional === 'Failed' ? 0 : null,
        comments: device.editedComments
      }));
      
      await axios.post(`/api/qc/purchases/${purchaseId}/update`, {
        devices: submissionData,
        qcCompleted
      }, {
        withCredentials: true
      });
      
      // Redirect to main QC page
      navigate('/qc');
    } catch (err: any) {
      console.error('Error submitting QC data:', err);
      alert('Failed to submit QC data. Please try again later.');
    } finally {
      setSaving(false);
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
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">QC Details</h1>
                <p className="text-gray-600">Purchase Order ID: {purchaseId}</p>
                {purchaseOrder && (
                  <div className="mt-2 text-gray-600">
                    <p>Date: {new Date(purchaseOrder.date).toLocaleDateString()}</p>
                    <p>Supplier: {purchaseOrder.supplier?.name || 'N/A'}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devices.length > 0 ? (
                      devices.map((device, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.imei}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.model_no}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="text"
                              value={device.editedColor}
                              onChange={(e) => handleDeviceChange(index, 'Color', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.storage}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              value={device.editedGrade}
                              onChange={(e) => handleDeviceChange(index, 'Grade', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="E">E</option>
                              <option value="F">F</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              value={device.editedCosmetic}
                              onChange={(e) => handleDeviceChange(index, 'Cosmetic', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Passed">Passed</option>
                              <option value="Failed">Failed</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              value={device.editedFunctional}
                              onChange={(e) => handleDeviceChange(index, 'Functional', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Passed">Passed</option>
                              <option value="Failed">Failed</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="text"
                              value={device.editedComments}
                              onChange={(e) => handleDeviceChange(index, 'Comments', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                          No devices found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QC Completion and Submit */}
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="qcCompleted"
                    checked={qcCompleted}
                    onChange={(e) => setQcCompleted(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="qcCompleted" className="ml-2 block text-sm text-gray-900">
                    Mark order as QC completed
                  </label>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    saving 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                  }`}
                >
                  {saving ? 'Saving...' : 'Submit QC Data'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QCDetail;