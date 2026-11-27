"use client";

import React, { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SettingsView() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currency, setCurrency] = useState("BDT (৳) - Bangladeshi Taka");
  const [billPrefix, setBillPrefix] = useState("B-");
  const [ocrEngine, setOcrEngine] = useState("EasyOCR (High Accuracy)");
  const [manualReview, setManualReview] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  };

  useEffect(() => {
    const savedCurrency = localStorage.getItem("crm_currency");
    const savedPrefix = localStorage.getItem("crm_bill_prefix");
    const savedOcr = localStorage.getItem("crm_ocr_engine");
    const savedReview = localStorage.getItem("crm_manual_review");
    const savedNotif = localStorage.getItem("crm_email_notif");

    if (savedCurrency) setCurrency(savedCurrency);
    if (savedPrefix) setBillPrefix(savedPrefix);
    if (savedOcr) setOcrEngine(savedOcr);
    if (savedReview !== null) setManualReview(savedReview === "true");
    if (savedNotif !== null) setEmailNotifications(savedNotif === "true");

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings/`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "Anwar");
          setEmail(data.email || "admin@smartcrm.com");
        } else {
          setName("Anwar");
          setEmail("admin@smartcrm.com");
        }
      } catch {
        setName("Anwar");
        setEmail("admin@smartcrm.com");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleResetDefaults = () => {
    setCurrency("BDT (৳) - Bangladeshi Taka");
    setBillPrefix("B-");
    setOcrEngine("EasyOCR (High Accuracy)");
    setManualReview(true);
    setEmailNotifications(true);
    setMessage("Default billing & OCR preferences restored. Click 'Save Settings' to apply.");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          email,
          new_password: newPassword,
        }),
      });

      if (res.ok) {
        localStorage.setItem("crm_currency", currency);
        localStorage.setItem("crm_bill_prefix", billPrefix);
        localStorage.setItem("crm_ocr_engine", ocrEngine);
        localStorage.setItem("crm_manual_review", String(manualReview));
        localStorage.setItem("crm_email_notif", String(emailNotifications));
        setNewPassword("");
        setMessage("All profile and billing preferences saved successfully!");
      } else {
        setError("Failed to update settings.");
      }
    } catch {
      setError("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="w-full font-sans space-y-5">
      {message && (
        <div className="px-4 py-3.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200/80 flex items-center justify-between">
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="px-4 py-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-200/80 flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 overflow-hidden">
        {/* Top Profile Header */}
        <div className="px-7 py-5 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg uppercase shadow-sm shadow-indigo-200">
              {name ? name.charAt(0) : "A"}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-gray-900">
                  {loading ? "Loading account..." : name || "Workspace Admin"}
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {loading ? "Fetching profile details..." : email || "admin@smartcrm.com"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              JWT Session Active
            </span>
          </div>
        </div>

        <div className="p-7 space-y-8">
          {/* Section 1: Profile & Security */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Profile & Account Security</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage your display name, email address, and login credentials.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    New Password <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Billing & OCR Preferences */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Billing & OCR Preferences</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure invoice numbering, currency formatting, and bill scanning behavior.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Reset to defaults
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition"
                >
                  <option value="BDT (৳) - Bangladeshi Taka">BDT (৳) - Bangladeshi Taka</option>
                  <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                  <option value="EUR (€) - Euro">EUR (€) - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Bill ID Prefix
                </label>
                <input
                  type="text"
                  value={billPrefix}
                  onChange={(e) => setBillPrefix(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Active OCR Engine
                </label>
                <select
                  value={ocrEngine}
                  onChange={(e) => setOcrEngine(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition"
                >
                  <option value="EasyOCR (High Accuracy)">EasyOCR (Column Strip + Table Parser)</option>
                  <option value="Tesseract OCR">Tesseract OCR (Standard)</option>
                </select>
              </div>
            </div>

            {/* Modern Toggle Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50/80 border border-gray-200/75 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Human-in-the-Loop Verification
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Require manual review before saving scanned bills
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={manualReview}
                  onClick={() => setManualReview((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    manualReview ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      manualReview ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 bg-gray-50/80 border border-gray-200/75 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Email Alerts & Daily Reports
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Receive notifications on summaries and failed scans
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailNotifications}
                  onClick={() => setEmailNotifications((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    emailNotifications ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      emailNotifications ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="px-7 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            Changes apply immediately to your session and billing defaults.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </form>
  );
}