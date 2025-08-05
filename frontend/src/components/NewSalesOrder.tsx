import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface Supplier {
  supplier_id: string;
  name: string;
}

interface Category {
  category_id: string;
  title: string;
}

interface Customer {
  id: number;
  customer_id: string;
  name: string;
}

interface Device {
  model_name: string;
  color: string;
  storage: string;
  grade: string;
  grade_id: number;
  manufacturer: string;
  quantity_available: number;
  // Add a unique id for grouped items
  id: string;
}

interface SalesOrderItem extends Device {
  quantity: number;
}

const DeviceRow: React.FC<{ 
  device: Device; 
  onAddToOrder: (device: Device, quantity: number) => void 
}> = ({ device, onAddToOrder }) => {
  const [quantity, setQuantity] = useState<number>(1);

  const handleAdd = () => {
    onAddToOrder(device, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {device.model_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.color}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.storage}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.grade}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.manufacturer}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {device.quantity_available}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max={device.quantity_available}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), device.quantity_available))}
            className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add
          </button>
        </div>
      </td>
    </tr>
  );
};

const NewSalesOrder: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [salesOrderItems, setSalesOrderItems] = useState<SalesOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Form states
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerRef, setCustomerRef] = useState<string>('');
  const [poRef, setPoRef] = useState<string>('');
  const [modelSearch, setModelSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalDevices, setTotalDevices] = useState<number>(0);

  useEffect(() => {
    fetchSuppliers();
    fetchCustomers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{ suppliers: Supplier[] }>('/api/suppliers', {
        params: { limit: 1000 },
        withCredentials: true
      });
      setSuppliers(response.data.suppliers);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get<any>('/api/customers', {
        params: { limit: 1000 },
        withCredentials: true
      });
      setCustomers(response.data.customers);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers. Please try again later.');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get<Category[]>('/api/categories', {
        withCredentials: true
      });
      setCategories(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch manufacturers. Please try again later.');
    }
  };

  const fetchDevices = async (page: number = 1) => {
    if (!selectedSupplier) return;
    
    try {
      setLoading(true);
      const response = await axios.get<any>('/api/inventory/imei/instock', {
        params: {
          supplierId: selectedSupplier,
          manufacturer: selectedManufacturer || undefined,
          modelSearch: modelSearch || undefined,
          page: page,
          limit: 10
        },
        withCredentials: true
      });
      
      // Add unique IDs to devices for React keys
      const devicesWithIds = response.data.devices.map((device: any, index: number) => ({
        ...device,
        id: `${device.manufacturer}-${device.model_name}-${device.color}-${device.storage}-${device.grade}-${index}`
      }));
      
      setDevices(devicesWithIds);
      setTotalPages(response.data.pagination.totalPages);
      setTotalDevices(response.data.pagination.totalDevices);
      setCurrentPage(response.data.pagination.currentPage);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      setError('Failed to fetch devices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSupplier) {
      fetchCategories();
      fetchDevices(1);
    } else {
      setDevices([]);
      setCategories([]);
    }
  }, [selectedSupplier, selectedManufacturer]);

  // Fetch devices when model search changes (with debounce)
  useEffect(() => {
    if (selectedSupplier) {
      const handler = setTimeout(() => {
        fetchDevices(1);
      }, 500); // 500ms delay

      return () => {
        clearTimeout(handler);
      };
    }
  }, [modelSearch]);

  const handleAddToOrder = (device: Device, quantity: number) => {
    if (quantity <= 0) return;
    
    // Check if item already exists in order
    const existingItemIndex = salesOrderItems.findIndex(item => item.id === device.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const updatedItems = [...salesOrderItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      setSalesOrderItems(updatedItems);
    } else {
      // Add new item to order
      setSalesOrderItems([
        ...salesOrderItems,
        {
          ...device,
          quantity: quantity
        }
      ]);
    }
  };

  const handleRemoveFromOrder = (id: string) => {
    setSalesOrderItems(salesOrderItems.filter(item => item.id !== id));
  };

  const handleSubmitOrder = () => {
    // This will be implemented later
    console.log('Submitting order:', {
      customer: selectedCustomer,
      customerRef: customerRef,
      poRef: poRef,
      items: salesOrderItems
    });
    alert('Order submission functionality will be implemented later.');
  };

  if (loading && suppliers.length === 0) {
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
              <h1 className="text-2xl font-bold text-gray-800">New Sales Order</h1>
              <p className="text-gray-600">Create a new sales order by selecting supplier and devices</p>
            </div>

            {/* Supplier and Manufacturer Selection */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Order Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.supplier_id} value={supplier.supplier_id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                    <select
                      value={selectedManufacturer}
                      onChange={(e) => setSelectedManufacturer(e.target.value)}
                      disabled={!selectedSupplier}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">All manufacturers</option>
                      {categories.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Devices in Stock */}
            {selectedSupplier && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-800">Devices in Stock</h2>
                </div>
                {/* Model Search */}
                <div className="p-4 border-b">
                  <div className="flex items-center">
                    <label className="block text-sm font-medium text-gray-700 mr-2">Model Search:</label>
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Search by model name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Available</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Add to Order</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {devices.length > 0 ? (
                        devices.map((device) => (
                          <DeviceRow 
                            key={device.id} 
                            device={device} 
                            onAddToOrder={handleAddToOrder} 
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                            No devices found in stock
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
                    <span className="font-medium">{totalDevices}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchDevices(currentPage - 1)}
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
                      onClick={() => fetchDevices(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        currentPage >= totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Order Details */}
            {salesOrderItems.length > 0 && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-800">Sales Order Details</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                      <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.customer_id} value={customer.customer_id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Ref</label>
                      <input
                        type="text"
                        value={customerRef}
                        onChange={(e) => setCustomerRef(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter customer reference"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PO Ref</label>
                      <input
                        type="text"
                        value={poRef}
                        onChange={(e) => setPoRef(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter PO reference"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Order Items */}
            {salesOrderItems.length > 0 && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-800">Sales Order Items</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesOrderItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.model_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.color}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.storage}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.grade}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.manufacturer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button
                              onClick={() => handleRemoveFromOrder(item.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {salesOrderItems.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitOrder}
                  className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Submit Sales Order
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewSalesOrder;