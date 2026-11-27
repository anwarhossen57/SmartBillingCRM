"use client";

import React, { useEffect, useState, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface OrderItem {
  id: number | string;
  bill_id?: string;
  customer_name?: string;
  mobile?: string;
  printed_datetime?: string;
  date_time?: string;
  total_amount?: string | number;
  status?: string;
  product_list?: string | string[];
  raw_text?: string;
  image_url?: string;
}

export default function OrdersView() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Ordering & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [ordering, setOrdering] = useState('-id');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Direct Lookup by Printed Bill ID (GET /api/bills/<bill_id>/)
  const [lookupId, setLookupId] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };
  }, []);

  const fetchOrders = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', String(targetPage));
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (customerFilter.trim()) params.append('customer', customerFilter.trim());
        if (dateFilter.trim()) params.append('printed_date', dateFilter.trim());
        if (ordering) params.append('ordering', ordering);

        const response = await fetch(`${API_BASE_URL}/api/bills/?${params.toString()}`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setOrders(data);
            setTotalCount(data.length);
            setTotalPages(1);
          } else {
            setOrders(data.results || []);
            setTotalCount(data.count || 0);
            setTotalPages(data.total_pages || 1);
            setPage(data.current_page || targetPage);
          }
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
      } finally {
        setLoading(false);
      }
    },
    [page, searchQuery, customerFilter, dateFilter, ordering, getAuthHeaders]
  );

  useEffect(() => {
    fetchOrders(page);
  }, [page, ordering, fetchOrders]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCustomerFilter('');
    setDateFilter('');
    setOrdering('-id');
    setPage(1);
    setLookupId('');
    setLookupError('');
    setTimeout(() => fetchOrders(1), 0);
  };

  const fetchBillDetailsById = async (billIdToFind: string) => {
    const cleanId = billIdToFind.trim();
    if (!cleanId) return;

    setLoadingDetail(true);
    setLookupError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/bills/${encodeURIComponent(cleanId)}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const billData = await response.json();
        setSelectedOrder(billData);
      } else {
        const errData = await response.json().catch(() => ({}));
        setLookupError(errData.error || `Bill '${cleanId}' not found.`);
      }
    } catch {
      setLookupError('Network error while fetching bill details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDirectLookup = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBillDetailsById(lookupId);
  };

  const handleStatusChange = async (billId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/update-order-status/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bill_id: billId, status: newStatus }),
      });

      if (response.ok) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        await fetchOrders(page);
      }
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="w-full font-sans space-y-6 relative">
      {/* Top Bar: Find Single Bill by Printed Bill ID */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Find Bill by Printed Bill ID</h3>
          <p className="text-xs text-gray-400">
            Directly fetch any invoice record from <code className="text-indigo-600">/api/bills/&lt;bill_id&gt;/</code>
          </p>
        </div>

        <form onSubmit={handleDirectLookup} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. B-1001"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 w-44"
          />
          <button
            type="submit"
            disabled={loadingDetail}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            {loadingDetail ? 'Finding...' : 'Find Bill'}
          </button>
        </form>
      </div>

      {lookupError && (
        <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-100">
          {lookupError}
        </div>
      )}

      {/* Main Orders & Bills Table Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Order & Bill Management ({totalCount})</h3>
            <p className="text-xs text-gray-400">
              Search, filter by customer or printed date, sort, and inspect details
            </p>
          </div>

          <form onSubmit={handleApplyFilters} className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Search Bill ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:outline-none focus:border-indigo-500 w-44"
            />
            <input
              type="text"
              placeholder="Filter Customer/Mobile..."
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:outline-none focus:border-indigo-500 w-44"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by Printed Date"
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 bg-white focus:outline-none"
            >
              <option value="-id" className="text-gray-900 bg-white">Newest First</option>
              <option value="bill_id" className="text-gray-900 bg-white">Bill ID (A-Z)</option>
              <option value="-bill_id" className="text-gray-900 bg-white">Bill ID (Z-A)</option>
              <option value="-total_amount" className="text-gray-900 bg-white">Amount (High-Low)</option>
              <option value="total_amount" className="text-gray-900 bg-white">Amount (Low-High)</option>
              <option value="-printed_datetime" className="text-gray-900 bg-white">Printed Date (Latest)</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Reset
            </button>
          </form>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium text-sm">
            Loading bills from database...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No matching bills found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Bill ID</th>
                    <th className="py-3.5 px-4 font-bold">Customer</th>
                    <th className="py-3.5 px-4 font-bold">Printed Date</th>
                    <th className="py-3.5 px-4 font-bold">Total Amount</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {orders.map((order) => {
                    const displayBillId = order.bill_id || String(order.id);
                    const currentStatus = order.status || 'Pending';
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-indigo-600">{displayBillId}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-gray-900">{order.customer_name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{order.mobile || ''}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600">
                          {order.printed_datetime || order.date_time || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {Number(order.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              currentStatus === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => fetchBillDetailsById(displayBillId)}
                            className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Page {page} of {totalPages} ({totalCount} total bills)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected Bill Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Bill Details: {selectedOrder.bill_id || selectedOrder.id}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Customer: {selectedOrder.customer_name || 'N/A'} | Mobile:{' '}
                  {selectedOrder.mobile || 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-gray-50 p-4 rounded-xl">
              <div>
                <span className="text-gray-400 block">Printed Date & Time</span>
                <span className="font-semibold text-gray-800">
                  {selectedOrder.printed_datetime || selectedOrder.date_time || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Total Amount</span>
                <span className="font-bold text-gray-900">
                  {Number(selectedOrder.total_amount || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Status</span>
                <span className="font-semibold text-indigo-600">
                  {selectedOrder.status || 'Pending'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Product List
              </h4>
              <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {Array.isArray(selectedOrder.product_list)
                  ? selectedOrder.product_list.join('\n')
                  : selectedOrder.product_list || 'No product items recorded.'}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Update Order Status:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={updatingStatus || selectedOrder.status === 'Pending'}
                  onClick={() =>
                    handleStatusChange(selectedOrder.bill_id || String(selectedOrder.id), 'Pending')
                  }
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  Mark Pending
                </button>
                <button
                  type="button"
                  disabled={updatingStatus || selectedOrder.status === 'Completed'}
                  onClick={() =>
                    handleStatusChange(
                      selectedOrder.bill_id || String(selectedOrder.id),
                      'Completed'
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  Mark Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}