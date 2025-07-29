"use client";

import { useState } from "react";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
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
              href="/dashboard" 
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-3">📊</span>
              Dashboard
            </Link>
            
            <Link 
              href="/inventory" 
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 bg-blue-50 border-r-4 border-blue-500"
            >
              <span className="mr-3">📦</span>
              Inventory
            </Link>
            
            <div className="px-4 py-2 mt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Operations</p>
            </div>
            
            <Link 
              href="/goods-in" 
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-3">📥</span>
              Goods In
            </Link>
            
            <Link 
              href="/goods-out" 
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-3">📤</span>
              Goods Out
            </Link>
            
            <div className="px-4 py-2 mt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</p>
            </div>
            
            <Link 
              href="/customers" 
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-3">👥</span>
              Customers
            </Link>
            
            <Link 
              href="/suppliers" 
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-3">🏢</span>
              Suppliers
            </Link>
            
            <Link 
              href="/reports" 
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50"
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <nav className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  type="button"
                  className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="hidden lg:block ml-4">
                  <h2 className="text-xl font-semibold text-gray-800">Inventory Management System</h2>
                </div>
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

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}