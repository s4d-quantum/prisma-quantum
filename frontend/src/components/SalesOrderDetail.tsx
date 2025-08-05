import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface SalesOrderItem {
  item_brand: string;
  item_details: string;
  item_color: string;
  item_grade: string;
  item_gb: string;
  quantity: number;
}

interface SalesOrderDetails {
  order_id: number;
  date: string;
  customer_id: string;
  customer_name: string;
  customer_ref: string | null;
  po_ref: string | null;
  goodsout_order_id: number | null;
  items: SalesOrderItem[];
}

const SalesOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<SalesOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(parseInt(id));
    }
  }, [id]);

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setLoading(true);
      const response = await axios.get<SalesOrderDetails>(`/api/sales-orders/${orderId}`, {
        withCredentials: true,
        timeout: 15000
      });
      
      setOrderDetails(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      if (err.response?.status === 404) {
        setError('Sales order not found');
      } else {
        setError('Failed to fetch sales order details. Please try again later.');
      }
    } finally {
      setLoading(false);
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
            onClick={() => navigate('/sales-orders')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Sales Orders
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

            {/* Order Summary Card */}
            {orderDetails && (
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-800">Order Summary</h2>
                  <button
                    onClick={() => navigate('/sales-orders')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Back to Sales Orders
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Order ID</h3>
                      <p className="mt-1 text-sm text-gray-900 font-medium">#{orderDetails.order_id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {orderDetails.date ? new Date(orderDetails.date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {orderDetails.customer_name || orderDetails.customer_id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Customer Ref</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {orderDetails.customer_ref || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">PO Ref</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {orderDetails.po_ref || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Goods Out ID</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {orderDetails.goodsout_order_id ? `#${orderDetails.goodsout_order_id}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Item Count</h3>
                      <p className="mt-1 text-sm text-gray-900">{orderDetails.items.length}</p>
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderDetails && orderDetails.items.length > 0 ? (
                      orderDetails.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.item_brand}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.item_details}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.item_color}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.item_grade}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.item_gb}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No devices found for this sales order
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

export default SalesOrderDetail;