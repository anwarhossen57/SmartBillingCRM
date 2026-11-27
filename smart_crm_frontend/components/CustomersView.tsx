"use client";

import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function CustomersView() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        setError('');
      } else {
        setError('Failed to fetch customer list from database.');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Network error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="w-full font-sans">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-gray-900">Registered Customers ({customers.length})</h3>
            <p className="text-xs text-gray-400 mt-0.5">Live customer records linked with scanned bills</p>
          </div>
          <button 
            onClick={fetchCustomers}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-semibold text-xs hover:bg-indigo-100 transition"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium text-sm">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No customers found in database. Upload a bill first!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3.5 px-6 font-bold">ID</th>
                  <th className="py-3.5 px-6 font-bold">Customer Name</th>
                  <th className="py-3.5 px-6 font-bold">Mobile Number</th>
                  <th className="py-3.5 px-6 font-bold">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-4 px-6 font-semibold text-gray-900">#{c.id}</td>
                    <td className="py-4 px-6 font-medium text-gray-900">{c.name}</td>
                    <td className="py-4 px-6 text-gray-600">{c.mobile}</td>
                    <td className="py-4 px-6 text-gray-500">{c.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
