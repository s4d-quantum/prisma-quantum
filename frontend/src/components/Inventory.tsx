import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';  // Removed authentication
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface ImeiDevice {
  id: number;
  item_imei: string;
  item_tac: string;
  item_color: string;
  item_grade: number;
  item_gb: string;
  status: number;
  purchase_id: number | null;
  unit_confirmed: number | null;
  created_at: string;
  // Additional fields from lookups
  grade_title?: string;
  manufacturer?: string;
  model?: string;
  supplier?: string;
}

interface ApiResponse {
  data: ImeiDevice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Supplier {
  supplier_id: string;
  name: string;
}

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<ImeiDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [storageFilter, setStorageFilter] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Removed authentication check - always authenticated
  const isAuthenticated = true;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [currentPage]);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers', {
        params: {
          page: 1,
          limit: 1000 // Fetch all suppliers (increased limit)
        },
        withCredentials: true
      });
      
      setSuppliers(response.data.suppliers);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse>('/api/inventory/imei', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
          status: statusFilter || undefined,
          storage: storageFilter || undefined,
          color: colorFilter || undefined,
          grade: gradeFilter || undefined,
          supplier: supplierFilter || undefined
        },
        withCredentials: true, // Important for CORS with credentials
        timeout: 5000 // 5 second timeout
      });
      
      setDevices(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      if (err.response?.status === 401) {
        setError('Access denied. Please log in to view inventory data.');
      } else if (err.response?.status === 404) {
        setError('Inventory endpoint not found. Please check if the Next.js backend is running and the API routes are correctly configured.');
        console.error('Inventory endpoint not found. Please check if the Next.js backend is running and the API routes are correctly configured.');
      } else {
        setError('Failed to fetch devices. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">In Stock</span>;
      case 0:
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Out of Stock</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Unknown</span>;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDevices();
  };

  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStorageFilter('');
    setColorFilter('');
    setGradeFilter('');
    setSupplierFilter('');
    setCurrentPage(1);
    fetchDevices();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchDevices();
  };

  const handleImeiClick = (imei: string) => {
    navigate(`/inventory/device/${imei}`);
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
            </div>

            {/* Search and Filters */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Search & Filters</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search by IMEI, Color, Storage..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="1">In Stock</option>
                      <option value="0">Out of Stock</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Storage</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={storageFilter}
                      onChange={(e) => {
                        setStorageFilter(e.target.value);
                      }}
                    >
                      <option value="">All Storage</option>
                      <option value="32">32GB</option>
                      <option value="64">64GB</option>
                      <option value="128">128GB</option>
                      <option value="256">256GB</option>
                      <option value="512">512GB</option>
                      <option value="1024">1024GB</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="Color"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={colorFilter}
                      onChange={(e) => setColorFilter(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={gradeFilter}
                      onChange={(e) => {
                        setGradeFilter(e.target.value);
                      }}
                    >
                      <option value="">All Grades</option>
                      <option value="1">A</option>
                      <option value="2">B</option>
                      <option value="3">C</option>
                      <option value="4">D</option>
                      <option value="5">E</option>
                      <option value="6">F</option>
                      <option value="7">U</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={supplierFilter}
                      onChange={(e) => {
                        setSupplierFilter(e.target.value);
                      }}
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.supplier_id} value={supplier.supplier_id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end space-x-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      onClick={handleClear}
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Devices Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Devices</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devices.length > 0 ? (
                      devices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline cursor-pointer" onClick={() => handleImeiClick(device.item_imei)}>
                            {device.item_imei}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.manufacturer || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.model || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.item_color}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.item_gb}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.grade_title || `Grade ${device.item_grade}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {device.supplier || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getStatusBadge(device.status)}
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

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{devices.length}</span> of{' '}
                  <span className="font-medium">{totalPages * 20}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Inventory;