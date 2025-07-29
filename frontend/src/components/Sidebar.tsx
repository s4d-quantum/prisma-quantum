import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`bg-white shadow-md transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out fixed lg:static inset-y-0 left-0 w-64 z-30`}>
      <div className="flex flex-col h-full">
        {/* Sidebar header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Inventory Manager</h1>
          <p className="text-sm text-gray-600">Version 2.0</p>
        </div>
        
        {/* Sidebar navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
          </div>
          
          <Link 
            to="/dashboard" 
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 ${isActive('/dashboard') ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
          >
            <span className="mr-3">📊</span>
            Dashboard
          </Link>
          
          <Link 
            to="/inventory" 
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 ${isActive('/inventory') ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
          >
            <span className="mr-3">📦</span>
            Inventory
          </Link>
          
          <div className="px-4 py-2 mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Operations</p>
          </div>
          
          <Link 
            to="/goods-in" 
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 ${isActive('/goods-in') ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
          >
            <span className="mr-3">📥</span>
            Goods In
          </Link>
          
          <Link 
            to="/goods-out" 
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 ${isActive('/goods-out') ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
          >
            <span className="mr-3">📤</span>
            Goods Out
          </Link>
          
          <div className="px-4 py-2 mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</p>
          </div>
          
          <Link 
            to="/customers" 
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 ${isActive('/customers') ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
          >
            <span className="mr-3">👥</span>
            Customers
          </Link>
          
          <Link 
            to="/suppliers" 
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 ${isActive('/suppliers') ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
          >
            <span className="mr-3">🏢</span>
            Suppliers
          </Link>
          
          <Link 
            to="/reports" 
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 ${isActive('/reports') ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}
          >
            <span className="mr-3">📈</span>
            Reports
          </Link>
        </nav>
        
        {/* Sidebar footer */}
        <div className="p-4 border-t">
          <p className="text-xs text-gray-500">© 2023 Inventory Manager</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;