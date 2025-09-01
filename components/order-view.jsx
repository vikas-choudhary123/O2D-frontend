"use client"
import { useState, useEffect } from "react"

export function OrdersView() {
  const [pendingOrders, setPendingOrders] = useState([])
  const [completeOrders, setCompleteOrders] = useState([])
  const [cancelOrders, setCancelOrders] = useState([])
  const [partialOrders, setPartialOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("pending")

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuC7Cy9GMEziCJi2wbP7S27ERl-_ZhpssLwFZ8_IUgf_Z6oJla8lV45VyX47vFIWg7/exec"

  const fetchOrderData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=ImporterSheet&action=fetch`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      const data = result.data
      if (!data || data.length === 0) {
        throw new Error('No data received from sheet')
      }

      // Assuming first row contains headers
      const headers = data[0]
      const rows = data.slice(1)

      // Find column indices
      const salesPersonIndex = headers.findIndex(h => h.toLowerCase().includes('salesperson'))
      const customerIndex = headers.findIndex(h => h.toLowerCase().includes('customer_name'))
      const vrnoIndex = headers.findIndex(h => h.toLowerCase().includes('vrno'))
      const dateIndex = headers.findIndex(h => h.toLowerCase().includes('vrdate'))
      const itemIndex = headers.findIndex(h => h.toLowerCase().includes('item_name'))
      const remarksIndex = headers.findIndex(h => h.toLowerCase().includes('entry_remark'))
      const priorityIndex = headers.findIndex(h => h.toLowerCase().includes('priority'))
      const rateIndex = headers.findIndex(h => h.toLowerCase().includes('rate'))
      const balanceIndex = headers.findIndex(h => h.toLowerCase().includes('balance_qty'))
      const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'))

      // Process rows into order objects
      const processedOrders = rows.map((row, index) => ({
        id: index + 1,
        salesperson: row[salesPersonIndex] || '',
        customerName: row[customerIndex] || '',
        vrno: row[vrnoIndex] || '',
        date: row[dateIndex] || '',
        itemName: row[itemIndex] || '',
        remarks: row[remarksIndex] || '',
        priority: row[priorityIndex] || '',
        rate: row[rateIndex] || '',
        balanceQty: row[balanceIndex] || '',
        status: row[statusIndex] || ''
      }))

      // Categorize orders by status
      const pending = processedOrders.filter(order => 
        order.status.toLowerCase().includes('pending') || order.status.toLowerCase().includes('open')
      )
      const complete = processedOrders.filter(order => 
        order.status.toLowerCase().includes('complete') || order.status.toLowerCase().includes('completed')
      )
      const cancelled = processedOrders.filter(order => 
        order.status.toLowerCase().includes('cancel') || order.status.toLowerCase().includes('cancelled')
      )
      const partial = processedOrders.filter(order => 
        order.status.toLowerCase().includes('partial')
      )

      setPendingOrders(pending)
      setCompleteOrders(complete)
      setCancelOrders(cancelled)
      setPartialOrders(partial)
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-gray-600">Manage all orders</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-gray-600">Manage all orders</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={fetchOrderData}
                className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTable = (data, type) => (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold capitalize">{type} Orders</h3>
        <p className="text-gray-600 text-sm">Orders with {type} status</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VR No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length > 0 ? (
              data.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.salesperson}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.customerName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.vrno}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.date}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.itemName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{order.remarks}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.priority}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.rate}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.balanceQty}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      type === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      type === 'complete' ? 'bg-green-100 text-green-800' :
                      type === 'cancel' ? 'bg-red-100 text-red-800' :
                      type === 'partial' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                  No {type} orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-gray-600">Manage all orders from ImporterSheet</p>
        </div>
        <button
          onClick={fetchOrderData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("partial")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "partial"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Partial ({partialOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("complete")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "complete"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Complete ({completeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("cancel")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cancel"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Cancel ({cancelOrders.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "pending" && renderTable(pendingOrders, "pending")}
        {activeTab === "partial" && renderTable(partialOrders, "partial")}
        {activeTab === "complete" && renderTable(completeOrders, "complete")}
        {activeTab === "cancel" && renderTable(cancelOrders, "cancel")}
      </div>
    </div>
  )
}