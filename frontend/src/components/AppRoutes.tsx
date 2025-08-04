import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import Login from './Login';
import Customers from './Customers';
import Suppliers from './Suppliers';
import DeviceInfo from './DeviceInfo';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/inventory/device/:imei" element={<DeviceInfo />} />
      <Route path="/goods-in" element={<div>Goods In Page</div>} />
      <Route path="/goods-out" element={<div>Goods Out Page</div>} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/reports" element={<div>Reports Page</div>} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;