import React, { useEffect, useState } from "react";

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const [userName, setUserName] = useState("Admin User");
  const [userEmail, setUserEmail] = useState("admin@smartcrm.com");

  useEffect(() => {
    // লোকাল স্টোরেজ থেকে ইউজারের নাম ও ইমেইল রিড করা (যদি লগিন করার সময় সেভ করা থাকে)
    const storedName = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email");
    
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
  }, []);

  const handleLogout = () => {
    // টোকেন এবং ইউজার ইনফো ডিলিট করে দেওয়া
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    // পেজ রিলোড করলেই অ্যাপ আবার AuthView-তে চলে যাবে
    window.location.reload();
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shadow-xs">
      <div>
        <div className="flex items-center px-6 py-5 border-b border-gray-100 bg-white">
          <div className="w-full flex items-center">
            <img 
              src="/logo.jpg" 
              alt="SmartCRM Logo" 
              className="w-36 h-auto object-contain" 
            />
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "dashboard"
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "customers"
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            👥 Customers
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "products"
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            📦 Products
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "orders"
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            🛒 Orders
          </button>
          <button
            onClick={() => setActiveTab("submit-bill")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "submit-bill"
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            📄 Submit Bill
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "reports"
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            📈 Reports
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "users"
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            👤 Users
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === "settings"
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            ⚙️ Settings
          </button>
          
          {/* কার্যকরী Logout বাটন */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* ডাইনামিক ইউজার প্রোফাইল সেকশন */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 px-2 py-1 text-sm text-gray-600">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}