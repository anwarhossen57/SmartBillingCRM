"use client";

import React, { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ReportsView() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("all");

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  };

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/bills/`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setBills(Array.isArray(data) ? data : data.results || []);
        }
      } catch {
        // Silent fallback if backend is offline
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  // ফিল্টার অনুযায়ী আসল বিল বাছাই
  const filteredBills =
    reportType === "all"
      ? bills
      : reportType === "pending"
      ? bills.filter((b) => (b.status || "").toLowerCase() === "pending")
      : bills.filter((b) => (b.status || "").toLowerCase() !== "pending");

  // আসল ডাটাবেজ থেকে হিসাব করা মেট্রিক্স
  const grossRevenue = filteredBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const totalInvoices = filteredBills.length;
  const avgOrderValue = totalInvoices > 0 ? grossRevenue / totalInvoices : 0;

  // আসল CSV ফাইল ডাউনলোড ফাংশন
  const handleDownloadCSV = (records, filename) => {
    if (!records || records.length === 0) {
      alert("No saved bills found in the database to export.");
      return;
    }

    const headers = ["Bill ID", "Customer Name", "Mobile", "Total Amount", "Printed Date/Time", "Status"];
    const rows = records.map((b) => [
      `"${b.bill_id || ""}"`,
      `"${b.customer_name || ""}"`,
      `"${b.mobile || ""}"`,
      `"${Number(b.total_amount || 0).toFixed(2)}"`,
      `"${b.printed_datetime || "N/A"}"`,
      `"${b.status || "Pending"}"`,
    ]);

    const csvString =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvString);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const dateTag = new Date().toISOString().slice(0, 10);

  const reportRows = [
    {
      id: 1,
      name: `All_Scanned_Bills_Summary_${dateTag}.csv`,
      type: `All Bills (${bills.length})`,
      date: todayFormatted,
      status: "Ready",
      records: bills,
    },
    {
      id: 2,
      name: `Pending_Bills_Audit_${dateTag}.csv`,
      type: `Pending (${bills.filter((b) => b.status === "Pending").length})`,
      date: todayFormatted,
      status: "Ready",
      records: bills.filter((b) => b.status === "Pending"),
    },
    {
      id: 3,
      name: `Completed_Paid_Bills_${dateTag}.csv`,
      type: `Paid/Completed (${bills.filter((b) => b.status !== "Pending").length})`,
      date: todayFormatted,
      status: "Ready",
      records: bills.filter((b) => b.status !== "Pending"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80 flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Financial & Billing Reports</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time performance and revenue metrics calculated directly from saved OCR bills.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all" className="text-gray-900 bg-white">All Bills Report</option>
            <option value="pending" className="text-gray-900 bg-white">Pending Bills Only</option>
            <option value="completed" className="text-gray-900 bg-white">Paid/Completed Only</option>
          </select>
          <button
            onClick={() => handleDownloadCSV(filteredBills, `SmartCRM_Report_${reportType}_${dateTag}.csv`)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-100 transition"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Gross Revenue</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">
            {loading ? "..." : `$${grossRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-2">
            ↑ Calculated from {totalInvoices} saved invoice(s)
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Total Invoices Generated</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">
            {loading ? "..." : totalInvoices}
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-2">
            ↑ Live database invoice count
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <p className="text-sm text-gray-500 font-medium">Average Order Value</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2">
            {loading ? "..." : `$${avgOrderValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </h3>
          <p className="text-xs text-gray-400 font-semibold mt-2">Mean value per scanned receipt</p>
        </div>
      </div>

      {/* Recent Export History Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Generated Reports History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-200">
                <th className="py-3 px-6">Report Name</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Generated Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {reportRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60 transition">
                  <td className="py-4 px-6 font-bold text-gray-900">{row.name}</td>
                  <td className="py-4 px-6 text-gray-600">{row.type}</td>
                  <td className="py-4 px-6 text-gray-500 text-xs">{row.date}</td>
                  <td className="py-4 px-6">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDownloadCSV(row.records, row.name)}
                      className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
