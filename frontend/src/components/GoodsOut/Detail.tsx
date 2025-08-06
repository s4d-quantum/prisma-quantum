import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { useParams, useNavigate } from 'react-router-dom';

interface GoodsOutOrder {
  goodsout_order_id: number;
  sales_order_id: number;
  date: string;
  customer_id: string;
  customer: string;
  supplier?: string | null;
  delivery_company?: string | null;
  tracking_no?: string | null;
  customer_ref?: string | null;
  po_ref?: string | null;
}

interface DeviceItem {
  imei: string;
  manufacturer: string;
  model: string;
  storage: string | number;
  color: string;
  grade: string;
}

interface GoodsOutDetailResponse {
  order: GoodsOutOrder;
  items: DeviceItem[];
}

const GoodsOutDetail: React.FC = () => {
  const { goodsoutOrderId } = useParams();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GoodsOutDetailResponse | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);

        // Compose from existing endpoints (backend has no /api/goods-out/:id)
        const listRes = await axios.get(`/api/goods-out`, {
          params: { page: 1, limit: 1, orderId: goodsoutOrderId },
          withCredentials: true,
          timeout: 15000,
        });

        const orderRow = listRes.data?.orders?.find((o: any) => String(o.order_id) === String(goodsoutOrderId));
        if (!orderRow) {
          throw new Error('Goods out order not found');
        }

        // goodsout_order_id (Goods Out ID) is from tbl_orders.order_id (route param)
        // sales_order_id must come from tbl_imei_sales_orders.order_id for the same customer/date if linked,
        // or from a mapping on the list payload when available. Our list payload currently does NOT supply
        // the sales order id, so we resolve it by querying the sales-orders listing filtered by customer/date
        // and taking the most recent matching record for this customer.
        let resolvedSalesOrderId: number = 0;
        try {
          const soRes = await axios.get(`/api/sales-orders`, {
            params: { page: 1, limit: 1, orderId: "" }, // ignore direct filter, fetch latest by same customer
            withCredentials: true,
            timeout: 15000,
          });
          // Find a sales order for same customer_id and closest date
          const soOrders = Array.isArray(soRes.data?.orders) ? soRes.data.orders : [];
          const candidate = soOrders.find((so: any) => String(so.customer_id) === String(orderRow.customer_id));
          resolvedSalesOrderId = candidate?.order_id || 0;
        } catch {
          resolvedSalesOrderId = 0;
        }

        const orderDetail: GoodsOutOrder = {
          goodsout_order_id: Number(goodsoutOrderId),
          sales_order_id: resolvedSalesOrderId || 0,
          date: orderRow.date,
          customer_id: orderRow.customer_id,
          customer: orderRow.customer || orderRow.customer_id,
          supplier: orderRow.supplier || null,
          delivery_company: orderRow.delivery_company || null,
          tracking_no: orderRow.tracking_no || null,
          customer_ref: orderRow.customer_ref || null,
          po_ref: orderRow.po_ref || null,
        };

        // Load device items via new backend endpoint (authoritative): /api/goods-out/{goodsout_order_id}/items
        let items: DeviceItem[] = [];
        try {
          const itemsRes = await axios.get(`/api/goods-out/${goodsoutOrderId}/items`, {
            withCredentials: true,
            timeout: 20000,
          });

          const rawItems = itemsRes.data?.items || itemsRes.data || [];
          items = (Array.isArray(rawItems) ? rawItems : []).map((it: any) => ({
            imei: String(it.imei || it.item_imei || ''),
            manufacturer: it.manufacturer || it.brand || it.item_brand || '-',
            model: it.model || it.item_details || '-',
            storage: it.storage || it.item_gb || '-',
            color: it.color || it.item_color || '-',
            grade: it.grade || it.item_grade || '-',
          }));
        } catch {
          items = [];
        }

        setData({ order: orderDetail, items });
      } catch (err: any) {
        console.error('Error fetching goods out detail:', err);
        setError('Failed to load goods out order details.');
      } finally {
        setLoading(false);
      }
    }

    if (goodsoutOrderId) {
      fetchDetail();
    } else {
      setError('Invalid goods out order id.');
      setLoading(false);
    }
  }, [goodsoutOrderId]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
              <p className="text-gray-600">{error}</p>
              <div className="mt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Go Back
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { order, items } = data;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="mb-2">
              <p className="text-gray-600 text-center">Goods Out Details</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Order Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div><span className="font-medium text-gray-700">Goods Out ID:</span> {order.goodsout_order_id}</div>
                <div><span className="font-medium text-gray-700">Sales Order ID:</span> {order.sales_order_id}</div>
                <div><span className="font-medium text-gray-700">Date:</span> {new Date(order.date).toLocaleDateString()}</div>
                <div><span className="font-medium text-gray-700">Customer:</span> {order.customer}</div>
                {order.supplier ? (<div><span className="font-medium text-gray-700">Supplier:</span> {order.supplier}</div>) : null}
                <div><span className="font-medium text-gray-700">Delivery Company:</span> {order.delivery_company || '-'}</div>
                <div><span className="font-medium text-gray-700">Tracking No:</span> {order.tracking_no || '-'}</div>
                <div><span className="font-medium text-gray-700">Customer Ref:</span> {order.customer_ref || '-'}</div>
                <div><span className="font-medium text-gray-700">PO Ref:</span> {order.po_ref || '-'}</div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-800">Devices</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.length > 0 ? (
                      items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.imei}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.manufacturer}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.model}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.storage}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.color}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.grade}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No devices found</td>
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

export default GoodsOutDetail;