export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">IMEI Stock</h3>
            <p className="text-2xl font-bold text-gray-900">1,234</p>
            <p className="text-sm text-green-600">+12% from last month</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Booked Out</h3>
            <p className="text-2xl font-bold text-gray-900">456</p>
            <p className="text-sm text-green-600">37% of total stock</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending QC</h3>
            <p className="text-2xl font-bold text-gray-900">78</p>
            <p className="text-sm text-yellow-600">+3 from yesterday</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Returns</h3>
            <p className="text-2xl font-bold text-gray-900">23</p>
            <p className="text-sm text-red-600">+5 this week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Stock</span>
                <span className="font-medium">890</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Low Stock</span>
                <span className="font-medium">45</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Out of Stock</span>
                <span className="font-medium">12</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Tasks</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Orders to Process</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Items to Restock</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Returns to Process</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">3</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <a href="/goods-in" className="p-4 text-center border rounded-lg hover:bg-gray-50">
                <div className="text-2xl mb-2">📥</div>
                <div className="text-sm">Goods In</div>
              </a>
              <a href="/goods-out" className="p-4 text-center border rounded-lg hover:bg-gray-50">
                <div className="text-2xl mb-2">📤</div>
                <div className="text-sm">Goods Out</div>
              </a>
              <a href="/inventory" className="p-4 text-center border rounded-lg hover:bg-gray-50">
                <div className="text-2xl mb-2">📦</div>
                <div className="text-sm">Inventory</div>
              </a>
              <a href="/reports" className="p-4 text-center border rounded-lg hover:bg-gray-50">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-sm">Reports</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
