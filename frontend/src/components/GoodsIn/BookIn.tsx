import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';

interface Supplier {
  supplier_id: string;
  name: string;
}

interface Grade {
  grade_id: number;
  title: string;
}

interface Tray {
  tray_id: string;
  title: string;
}

interface Device {
  imei: string;
  manufacturer: string;
  model: string;
  color: string;
  grade: number;
  storage: string;
  tray: string;
}

const GoodsInBookIn: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Purchase order form fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState<string>('');
  const [qcRequired, setQcRequired] = useState<boolean>(false);
  const [repairRequired, setRepairRequired] = useState<boolean>(false);
  const [poReference, setPoReference] = useState<string>('');
  
  // Default device properties
  const [defaultColor, setDefaultColor] = useState<string>('');
  const [defaultGrade, setDefaultGrade] = useState<number>(0);
  const [defaultStorage, setDefaultStorage] = useState<string>('64');
  const [defaultTray, setDefaultTray] = useState<string>('');
  
  // Scanning
  const [scannedImei, setScannedImei] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanStatus, setScanStatus] = useState<string>('');
  
  // Dropdown options
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [trays, setTrays] = useState<Tray[]>([]);
  
  const imeiInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetchSuppliers();
    fetchGrades();
    fetchTrays();
  }, []);
  
  useEffect(() => {
    if (imeiInputRef.current) {
      imeiInputRef.current.focus();
    }
  }, []);
  
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers', {
        params: {
          page: 1,
          limit: 1000
        },
        withCredentials: true
      });
      
      setSuppliers(response.data.suppliers);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setScanStatus('Error fetching suppliers');
    }
  };
  
  const fetchGrades = async () => {
    try {
      // For now, we'll use hardcoded grades since there's no API endpoint
      const gradeData = [
        { grade_id: 0, title: 'NULL' },
        { grade_id: 1, title: 'A' },
        { grade_id: 2, title: 'B' },
        { grade_id: 3, title: 'C' },
        { grade_id: 4, title: 'D' },
        { grade_id: 5, title: 'E' },
        { grade_id: 6, title: 'F' }
      ];
      
      setGrades(gradeData);
    } catch (err) {
      console.error('Error fetching grades:', err);
      setScanStatus('Error fetching grades');
    }
  };
  
  const fetchTrays = async () => {
    try {
      const response = await axios.get('/api/trays', {
        withCredentials: true
      });
      
      setTrays(response.data.trays);
    } catch (err) {
      console.error('Error fetching trays:', err);
      setScanStatus('Error fetching trays');
    }
  };
  
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedImei.trim()) return;
    
    try {
      setScanStatus(`Scanning device ${scannedImei}...`);
      
      // Fetch TAC information
      const tacResponse = await axios.get(`/api/tac?imei=${scannedImei}`, {
        withCredentials: true
      });
      
      const tacData = tacResponse.data;
      
      // Create new device object with default values where needed
      const newDevice: Device = {
        imei: scannedImei,
        manufacturer: tacData.manufacturer || 'Unknown',
        model: tacData.model || 'Unknown',
        color: defaultColor,
        grade: defaultGrade,
        storage: defaultStorage,
        tray: defaultTray
      };
      
      // Add device to the list
      setDevices(prev => [...prev, newDevice]);
      setScanStatus(`Device ${scannedImei} added successfully`);
      
      // Clear input and focus for next scan
      setScannedImei('');
      if (imeiInputRef.current) {
        imeiInputRef.current.focus();
      }
    } catch (err: any) {
      console.error('Error scanning device:', err);
      setScanStatus(`Device ${scannedImei} not found or error occurred`);
    }
  };
  
  const updateDevice = (index: number, field: keyof Device, value: string | number) => {
    setDevices(prev => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };
  
  const removeDevice = (index: number) => {
    setDevices(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for submission
    const submissionData = {
      date,
      supplier_id: supplier,
      qc_required: qcRequired,
      repair_required: repairRequired,
      po_ref: poReference,
      tray_id: defaultTray,
      devices: devices.map(device => ({
        imei: device.imei,
        color: device.color,
        grade: device.grade,
        storage: device.storage,
        tray: device.tray
      }))
    };
    
    try {
      setScanStatus('Submitting purchase order...');
      
      const response = await axios.post('/api/goods-in/submit', submissionData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 201) {
        setScanStatus('Purchase order submitted successfully');
        
        // Automatically generate and download delivery note PDF
        try {
          // Get the purchase ID from the response
          const purchaseId = response.data.purchaseId;
          
          if (purchaseId) {
            // Generate delivery note
            const pdfResponse = await axios.get(`/api/goods-in/${purchaseId}/delivery-note`, {
              responseType: 'blob',
              withCredentials: true
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `delivery-note-${purchaseId}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
          }
        } catch (pdfError) {
          console.error('Error generating delivery note:', pdfError);
          // Don't block the success message if PDF generation fails
        }
        
        // Clear the devices list after successful submission
        setDevices([]);
        // Optionally redirect to the detail page or show a success message
      } else {
        setScanStatus('Error submitting purchase order');
      }
    } catch (err) {
      console.error('Error submitting purchase order:', err);
      setScanStatus('Error submitting purchase order');
    }
  };
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Book In New Purchase</h1>
                  <p className="text-gray-600">Create a new purchase order and scan devices</p>
                </div>
                <button
                  onClick={() => navigate('/goods-in')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Back to Goods In
                </button>
              </div>
            </div>
            
            {/* Purchase Order Form */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Purchase Order Details</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      required
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((sup) => (
                        <option key={sup.supplier_id} value={sup.supplier_id}>
                          {sup.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">QC Required</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={qcRequired}
                        onChange={(e) => setQcRequired(e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-600">Yes</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repair Required</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={repairRequired}
                        onChange={(e) => setRepairRequired(e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-600">Yes</span>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Reference</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={poReference}
                      onChange={(e) => setPoReference(e.target.value)}
                      placeholder="Enter PO reference"
                    />
                  </div>
                </form>
              </div>
            </div>
            
            {/* Default Device Properties */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Default Device Properties</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={defaultColor}
                      onChange={(e) => setDefaultColor(e.target.value)}
                      placeholder="Enter default color"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={defaultGrade}
                      onChange={(e) => setDefaultGrade(parseInt(e.target.value))}
                    >
                      {grades.map((grade) => (
                        <option key={grade.grade_id} value={grade.grade_id}>
                          {grade.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={defaultStorage}
                      onChange={(e) => setDefaultStorage(e.target.value)}
                    >
                      <option value="16">16 GB</option>
                      <option value="32">32 GB</option>
                      <option value="64">64 GB</option>
                      <option value="128">128 GB</option>
                      <option value="256">256 GB</option>
                      <option value="512">512 GB</option>
                      <option value="1024">1 TB</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tray</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={defaultTray}
                      onChange={(e) => setDefaultTray(e.target.value)}
                    >
                      <option value="">Select a tray</option>
                      {trays.map((tray) => (
                        <option key={tray.tray_id} value={tray.tray_id}>
                          {tray.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scanning Interface */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Scan Devices</h2>
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
                    scanStatus.includes('added') ? 
                    "bg-green-100 text-green-800" : 
                    scanStatus.includes('not found') || scanStatus.includes('error') ? 
                    "bg-red-100 text-red-800" : 
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {scanStatus}
                  </div>
                )}
              </div>
            </div>
            
            {/* Scanned Devices Table */}
            {devices.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-800">Scanned Devices ({devices.length})</h2>
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tray</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {devices.map((device, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.imei}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.manufacturer}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{device.model}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="text"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={device.color}
                              onChange={(e) => updateDevice(index, 'color', e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={device.grade}
                              onChange={(e) => updateDevice(index, 'grade', parseInt(e.target.value))}
                            >
                              {grades.map((grade) => (
                                <option key={grade.grade_id} value={grade.grade_id}>
                                  {grade.title}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={device.storage}
                              onChange={(e) => updateDevice(index, 'storage', e.target.value)}
                            >
                              <option value="16">16 GB</option>
                              <option value="32">32 GB</option>
                              <option value="64">64 GB</option>
                              <option value="128">128 GB</option>
                              <option value="256">256 GB</option>
                              <option value="512">512 GB</option>
                              <option value="1024">1 TB</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <select
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={device.tray}
                              onChange={(e) => updateDevice(index, 'tray', e.target.value)}
                            >
                              <option value="">Select a tray</option>
                              {trays.map((tray) => (
                                <option key={tray.tray_id} value={tray.tray_id}>
                                  {tray.title}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDevice(index);
                              }}
                              className="text-red-600 hover:text-red-900 focus:outline-none"
                              aria-label="Remove device"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Submit Purchase Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GoodsInBookIn;