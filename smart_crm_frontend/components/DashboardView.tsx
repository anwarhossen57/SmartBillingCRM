"use client";

import React, { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface DashboardStats {
  total_revenue: number;
  total_bills: number;
  total_customers: number;
}

interface RecentBill {
  id: number;
  bill_id: string;
  customer_name: string;
  mobile: string;
  total_amount: number;
  printed_datetime?: string;
  status: string;
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>({
    total_revenue: 0,
    total_bills: 0,
    total_customers: 0,
  });
  const [recentBills, setRecentBills] = useState<RecentBill[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        let rev = 0;
        let billCount = 0;
        let custCount = 0;

        // ১. ড্যাশবোর্ডের মূল পরিসংখ্যান আনা
        const statsRes = await fetch(`${API_BASE_URL}/api/dashboard-stats/`, {
          headers: getAuthHeaders(),
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          rev = Number(statsData.total_revenue || 0);
          billCount = Number(statsData.total_bills || 0);
          custCount = Number(statsData.active_customers ?? statsData.total_customers ?? 0);
        }

        // ২. যদি stats API-তে কাস্টমার সংখ্যা 0 আসে, তবে সরাসরি /api/customers/ থেকে আসল সংখ্যা নেওয়া
        if (custCount === 0) {
          const custRes = await fetch(`${API_BASE_URL}/api/customers/`, {
            headers: getAuthHeaders(),
          });
          if (custRes.ok) {
            const custData = await custRes.json();
            if (Array.isArray(custData)) {
              custCount = custData.length;
            }
          }
        }

        setStats({
          total_revenue: rev,
          total_bills: billCount,
          total_customers: custCount,
        });

        // ৩. সর্বশেষ ৫টি বিল আনা
        const billsRes = await fetch(`${API_BASE_URL}/api/bills/`, {
          headers: getAuthHeaders(),
        });
        if (billsRes.ok) {
          const billsData = await billsRes.json();
          const allBills = Array.isArray(billsData) ? billsData : billsData.results || [];
          setRecentBills(allBills.slice(0, 5));
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="w-full font-sans space-y-6">
      {/* Top 3 KPI Summary Cards (Full Width & Aligned) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-2">
              {loading
                ? "..."
                : `$${stats.total_revenue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-2">
              ↑ Live revenue from saved OCR bills
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            $
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Total Bills Processed
            </p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-2">
              {loading ? "..." : stats.total_bills}
            </h3>
            <p className="text-xs text-indigo-600 font-semibold mt-2">
              Verified & saved in database
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            🧾
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Active Customers
            </p>
            <h3 className="text-3xl font-extrabold text-gray-900 mt-2">
              {loading ? "..." : stats.total_customers}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-2">
              Auto-linked via mobile number
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            👥
          </div>
        </div>
      </div>

      {/* Recent Scanned Bills Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Scanned Bills</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Latest 5 invoices processed through OCR and saved to the system
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
            Live Feed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[11px] font-bold tracking-wider border-b border-gray-200">
                <th className="py-3.5 px-6">Bill ID</th>
                <th className="py-3.5 px-6">Customer Name</th>
                <th className="py-3.5 px-6">Mobile</th>
                <th className="py-3.5 px-6">Printed Date/Time</th>
                <th className="py-3.5 px-6">Total Amount</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Loading recent bills...
                  </td>
                </tr>
              ) : recentBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No bills processed yet. Go to Submit Bill to upload your first receipt!
                  </td>
                </tr>
              ) : (
                recentBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-4 px-6 font-bold text-indigo-600">{bill.bill_id}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900">{bill.customer_name}</td>
                    <td className="py-4 px-6 text-gray-600">{bill.mobile}</td>
                    <td className="py-4 px-6 text-gray-500 text-xs">
                      {bill.printed_datetime || "N/A"}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      ${Number(bill.total_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          bill.status === "Pending"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
