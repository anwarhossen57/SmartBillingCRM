"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import ProductsView from "@/components/ProductsView";
import UsersView from "@/components/UsersView";
import ReportsView from "@/components/ReportsView";
import SettingsView from "@/components/SettingsView";
import OrdersView from "@/components/OrdersView";
import SubmitBillView from "@/components/SubmitBillView";
import CustomersView from "@/components/CustomersView";
import AuthView from "@/components/AuthView";

export default function SmartCRMDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true); // <--- New state
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Auth Guard to check token on page load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Show a loader until the token is checked (to prevent login page flickering)
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-indigo-600 font-bold text-xl animate-pulse">Loading SmartCRM...</div>
      </div>
    );
  }

  // If not authenticated, show Login/Signup page
  if (!isAuthenticated) {
    return <AuthView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // If authenticated, show the Main Dashboard
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "customers" && "Customer Directory"}
              {activeTab === "products" && "Product Inventory"}
              {activeTab === "orders" && "Orders Management"}
              {activeTab === "submit-bill" && "Submit Bill"}
              {activeTab === "reports" && "System Reports & Analytics"}
              {activeTab === "users" && "User Access Management"}
              {activeTab === "settings" && "Account & App Settings"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === "dashboard" && "Monitor your live revenue, processed bills, and active clients."}
              {activeTab === "customers" && "View and manage all registered customer details from database."}
              {activeTab === "products" && "Add, view, and manage available inventory and service offerings."}
              {activeTab === "orders" && "Track customer orders, fulfillment, and payment statuses."}
              {activeTab === "submit-bill" && "Upload or scan bills to automatically extract and save details."}
              {activeTab === "reports" && "Generate, view, and export system-wide billing and financial analytics."}
              {activeTab === "users" && "Manage CRM system users, roles, and access permissions."}
              {activeTab === "settings" && "Change your personal info, password, and basic app preferences."}
            </p>
          </div>
          {activeTab === "orders" && (
            <button 
              onClick={() => setActiveTab("submit-bill")} 
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition"
            >
              + Add New Order
            </button>
          )}
        </header>

        {/* Dynamic Component Rendering Based on Tab */}
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "customers" && <CustomersView />}
        {activeTab === "products" && <ProductsView />}
        {activeTab === "orders" && <OrdersView />}
        {activeTab === "submit-bill" && <SubmitBillView />}
        {activeTab === "reports" && <ReportsView />}
        {activeTab === "users" && <UsersView />}
        {activeTab === "settings" && <SettingsView />}
      </main>
    </div>
  );
}