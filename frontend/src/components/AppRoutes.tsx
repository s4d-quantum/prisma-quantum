import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import Login from './Login';
import Customers from './Customers';
import Suppliers from './Suppliers';
import DeviceInfo from './DeviceInfo';
import GoodsIn from './GoodsIn';
import GoodsOut from './GoodsOut';
import GoodsInDetail from './GoodsIn/Detail';
import SalesOrders from './SalesOrders';
import NewSalesOrder from './NewSalesOrder';
import SalesOrderDetail from './SalesOrderDetail';
import GoodsOutScan from './GoodsOut/Scan';
import GoodsOutDetail from './GoodsOut/Detail';
import GoodsInBookIn from './GoodsIn/BookIn';
import QC from './QC';
import QCDetail from './QCDetail';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/inventory/device/:imei" element={<DeviceInfo />} />
      <Route path="/goods-in" element={<GoodsIn />} />
      <Route path="/goods-in/detail/:id" element={<GoodsInDetail />} />
      <Route path="/goods-out" element={<GoodsOut />} />
      <Route path="/goods-out/:goodsoutOrderId" element={<GoodsOutDetail />} />
      <Route path="/sales-orders" element={<SalesOrders />} />
      <Route path="/sales-orders/new" element={<NewSalesOrder />} />
      <Route path="/sales-orders/:id" element={<SalesOrderDetail />} />
      <Route path="/goods-out/scan/:orderId" element={<GoodsOutScan />} />
      <Route path="/goods-in/book-in" element={<GoodsInBookIn />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/reports" element={<div>Reports Page</div>} />
      <Route path="/qc" element={<QC />} />
      <Route path="/qc/:purchaseId" element={<QCDetail />} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;