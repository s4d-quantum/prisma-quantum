import React from 'react';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/inventory':
        return 'Inventory';
      case '/goods-in':
        return 'Goods In';
      case '/goods-out':
        return 'Goods Out';
      case '/customers':
        return 'Customers';
      case '/suppliers':
        return 'Suppliers';
      case '/reports':
        return 'Reports';
      case '/sales-orders':
        return 'Sales Orders';
      case '/sales-orders/new':
        return 'New Sales Order';
      default:
        // For device info page, we'll handle it separately
        if (location.pathname.startsWith('/inventory/device/')) {
          const imei = location.pathname.split('/').pop();
          return `Device Information
Detailed information for device ${imei}`;
        }
        // For sales order detail page
        if (location.pathname.startsWith('/sales-orders/')) {
          const orderId = location.pathname.split('/').pop();
          // Check if it's a valid number (not 'new')
          if (orderId !== 'new' && !isNaN(Number(orderId))) {
            return `Sales Order Details`;
          }
        }
        return 'Inventory Management System';
    }
  };

  const title = getPageTitle();
  const isDeviceInfoPage = location.pathname.startsWith('/inventory/device/');

  return (
    <nav className="bg-white shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={onMenuClick}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* Centered page title */}
          <div className="flex-1 flex items-center justify-center">
            {isDeviceInfoPage ? (
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">Device Information</h2>
                <p className="text-sm text-gray-600">Detailed information for device {location.pathname.split('/').pop()}</p>
              </div>
            ) : (
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            )}
          </div>
          
          <div className="flex items-center">
            {/* User menu */}
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                
                <div className="flex items-center">
                  <div className="text-right mr-3 hidden md:block">
                    <p className="text-sm font-medium text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    AU
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;