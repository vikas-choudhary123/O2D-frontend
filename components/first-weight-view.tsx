"use client"
import { useState, useEffect, useRef } from 'react'

export function FirstWeightView() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [customerFilter, setCustomerFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPendingData, setFilteredPendingData] = useState([])
  const [filteredHistoryData, setFilteredHistoryData] = useState([])

  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMorePending, setHasMorePending] = useState(true);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const scrollContainerRef = useRef(null);

  const API_BASE_URL = "https://o2d-backend-setup.onrender.com"; // your backend URL


  // ✅ Load data when tab changes (only once per tab)
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      if (activeTab === "pending" && pendingData.length === 0) {
        await fetchSheetData(1, 1);
      } else if (activeTab === "history" && historyData.length === 0) {
        await fetchSheetData(1, 1);
      }
      setInitialLoadDone(true);
      setLoading(false);
    };
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);



  // ✅ Filter logic
useEffect(() => {
  let pendingResult = [...pendingData];
  if (customerFilter) {
    pendingResult = pendingResult.filter(item => item.customerName === customerFilter);
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    pendingResult = pendingResult.filter(item =>
      item.orderNumber.toLowerCase().includes(term) ||
      item.gateEntryNumber.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      item.truckNumber.toLowerCase().includes(term)
    );
  }
  setFilteredPendingData(pendingResult);

  let historyResult = [...historyData];
  if (customerFilter) {
    historyResult = historyResult.filter(item => item.customerName === customerFilter);
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    historyResult = historyResult.filter(item =>
      item.orderNumber.toLowerCase().includes(term) ||
      item.gateEntryNumber.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      item.truckNumber.toLowerCase().includes(term) ||
      item.wbSlipNo?.toLowerCase().includes(term)
    );
  }
  setFilteredHistoryData(historyResult);
}, [pendingData, historyData, customerFilter, searchTerm]);


  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).replace(",", "");
  };


  // ✅ Fetch per-tab data only
const fetchSheetData = async (pagePending = pendingPage, pageHistory = historyPage) => {
  try {
    setError(null);

    if (activeTab === "pending") {
      const url = `${API_BASE_URL}/first-weight/pending?page=${pagePending}&limit=50${
        customerFilter ? `&customer=${encodeURIComponent(customerFilter)}` : ""
      }`;
      const res = await fetch(url);
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const pending = result.data.map(item => ({
          orderNumber: item.ORDER_VRNO || "",
          gateEntryNumber: item.VRNO || "",
          customerName: item.PARTY_NAME || "",
          truckNumber: item.TRUCKNO || "",
          driverName: item.DRIVER_NAME || "",
          driverMobile: item.DRIVER_MOBILE || "",
          driverLicense: item.DRIVER_DRIVING_LICENSE || "",
          planned2: item.PLANNED_TIMESTAMP
            ? new Date(item.PLANNED_TIMESTAMP).toLocaleString("en-GB")
            : "",
        }));

        if (pagePending === 1) setPendingData(pending);
        else setPendingData(prev => [...prev, ...pending]);

        setHasMorePending(pending.length === 50);
      }
    }

    if (activeTab === "history") {
      const url = `${API_BASE_URL}/first-weight/history?page=${pageHistory}&limit=50${
        customerFilter ? `&customer=${encodeURIComponent(customerFilter)}` : ""
      }`;
      const res = await fetch(url);
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const history = result.data.map(item => ({
          orderNumber: item.ORDER_VRNO || "",
          gateEntryNumber: item.VRNO || "",
          customerName: item.PARTY_NAME || "",
          truckNumber: item.TRUCKNO || "",
          wbSlipNo: item.WSLIP_NO || "",
          actualTimestamp: item.ACTUAL_TIMESTAMP
            ? new Date(item.ACTUAL_TIMESTAMP).toLocaleString("en-GB")
            : "",
          planned2: item.PLANNED_TIMESTAMP
            ? new Date(item.PLANNED_TIMESTAMP).toLocaleString("en-GB")
            : "",
        }));

        if (pageHistory === 1) setHistoryData(history);
        else setHistoryData(prev => [...prev, ...history]);

        setHasMoreHistory(history.length === 50);
      }
    }
  } catch (err) {
    setError("Error fetching data: " + err.message);
  } finally {
    setLoading(false);
  }
};



  // ✅ Infinite scroll handler
useEffect(() => {
  const container = scrollContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    const bottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 20;

    if (!initialLoadDone || loading) return;

    if (bottom) {
      if (activeTab === "pending" && hasMorePending) {
        const nextPage = pendingPage + 1;
        setPendingPage(nextPage);
        fetchSheetData(nextPage, historyPage);
      } else if (activeTab === "history" && hasMoreHistory) {
        const nextPage = historyPage + 1;
        setHistoryPage(nextPage);
        fetchSheetData(pendingPage, nextPage);
      }
    }
  };

  container.addEventListener("scroll", handleScroll);
  return () => container.removeEventListener("scroll", handleScroll);
}, [
  activeTab,
  hasMorePending,
  hasMoreHistory,
  loading,
  initialLoadDone,
  pendingPage,
  historyPage,
]);






  if (loading && !initialLoadDone) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">First Weight</h2>
          <p className="text-gray-600">Vehicle weighing before loading</p>
        </div>
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Loading Data</h3>
            <p className="text-gray-600 text-sm">Fetching data...</p>
          </div>
          <div className="px-6 py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">First Weight</h2>
          <p className="text-gray-600">Vehicle weighing before loading</p>
        </div>
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Error Loading Data</h3>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <button
              onClick={() => fetchSheetData(1, 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">First Weight</h2>
        <p className="text-gray-600">Vehicle weighing before loading</p>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        {/* Filter Controls */}
<div className="bg-white p-4 rounded-lg shadow border mb-4">
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="w-full sm:w-auto">
      <label htmlFor="customer-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Filter by Customer
      </label>
      <select
        id="customer-filter"
        value={customerFilter}
        onChange={(e) => setCustomerFilter(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Customers</option>
        {[...new Set([...pendingData, ...historyData].map(item => item.customerName))].filter(name => name).sort().map((name, index) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
    
    <div className="w-full sm:flex-1">
      <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Search
      </label>
      <input
        id="search-filter"
        type="text"
        placeholder="Search by order number, gate entry, customer, truck number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div className="flex items-end">
      <button
        onClick={() => {
          setCustomerFilter('')
          setSearchTerm('')
        }}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        Clear Filters
      </button>
    </div>
  </div>
</div>

{/* Tab Navigation */}
<div className="border-b border-gray-200">
  <nav className="-mb-px flex space-x-8">
    <button
      onClick={() => setActiveTab('pending')}
      className={`py-2 px-1 border-b-2 font-medium text-sm ${
        activeTab === 'pending'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      Pending ({filteredPendingData.length})
    </button>
    <button
      onClick={() => setActiveTab('history')}
      className={`py-2 px-1 border-b-2 font-medium text-sm ${
        activeTab === 'history'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      History ({filteredHistoryData.length})
    </button>
  </nav>
</div>

        {/* Pending Tab Content */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Pending First Weight</h3>
              <p className="text-gray-600 text-sm">Vehicles waiting for first weighing</p>
            </div>
            <div
  ref={scrollContainerRef}
  className="overflow-x-auto mobile-card-view"
  style={{ maxHeight: '350px', overflowY: 'auto' }}
>

  {/* Desktop Table View */}
  <table className="w-full hidden md:table">
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredPendingData.length > 0 ? (
        filteredPendingData.map((entry, index) => (
          <tr key={entry.gateEntryNumber || index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.orderNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.gateEntryNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.customerName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.truckNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.planned2}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
            No pending records found
          </td>
        </tr>
      )}
    </tbody>
  </table>

  {/* Mobile Card View */}
  <div className="md:hidden">
    {filteredPendingData.length > 0 ? (
      filteredPendingData.map((entry, index) => (
        <div key={entry.gateEntryNumber || index} className="mobile-card">
          <div className="mobile-card-row">
            <span className="mobile-card-label">Order Number:</span>
            <span className="mobile-card-value">{entry.orderNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Gate Entry Number:</span>
            <span className="mobile-card-value">{entry.gateEntryNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Customer Name:</span>
            <span className="mobile-card-value">{entry.customerName}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Truck Number:</span>
            <span className="mobile-card-value">{entry.truckNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Planned:</span>
            <span className="mobile-card-value">{entry.planned2}</span>
          </div>
        </div>
      ))
    ) : (
      <div className="px-6 py-8 text-center text-gray-500">
        No pending records found
      </div>
    )}
  </div>
</div>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">First Weight History</h3>
              <p className="text-gray-600 text-sm">Completed first weighing records</p>
            </div>
            <div
  ref={scrollContainerRef}
  className="overflow-x-auto mobile-card-view"
  style={{ maxHeight: '350px', overflowY: 'auto' }}
>

  {/* Desktop Table View */}
  <table className="w-full hidden md:table">
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WB Slip No</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredHistoryData.length > 0 ? (
        filteredHistoryData.map((entry, index) => (
          <tr key={entry.gateEntryNumber || index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.orderNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.gateEntryNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.customerName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.truckNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {entry.wbSlipNo}
              </span>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
            No history records found
          </td>
        </tr>
      )}
    </tbody>
  </table>

  {/* Mobile Card View */}
  <div className="md:hidden">
    {filteredHistoryData.length > 0 ? (
      filteredHistoryData.map((entry, index) => (
        <div key={entry.gateEntryNumber || index} className="mobile-card">
          <div className="mobile-card-row">
            <span className="mobile-card-label">Order Number:</span>
            <span className="mobile-card-value">{entry.orderNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Gate Entry Number:</span>
            <span className="mobile-card-value">{entry.gateEntryNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Customer Name:</span>
            <span className="mobile-card-value">{entry.customerName}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Truck Number:</span>
            <span className="mobile-card-value">{entry.truckNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">WB Slip No:</span>
            <span className="mobile-card-value">
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {entry.wbSlipNo}
              </span>
            </span>
          </div>
        </div>
      ))
    ) : (
      <div className="px-6 py-8 text-center text-gray-500">
        No history records found
      </div>
    )}
  </div>
</div>
          </div>
        )}
      </div>
    </div>
  )
}