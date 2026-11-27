"use client";

import React, { useState, useEffect, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStatus, setNewStatus] = useState("In Stock");

  // Edit/Remove Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState("In Stock");

  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json" };
  }, []);

  useEffect(() => {
    const fetchDynamicProducts = async () => {
      setLoading(true);
      const productMap = new Map();

      // ১. ডাটাবেজে সেভ করা সব বিল থেকে আসল প্রোডাক্ট ও একক দাম সংগ্রহ
      try {
        const res = await fetch(`${API_BASE_URL}/api/bills/`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const bills = Array.isArray(data) ? data : data.results || [];

          bills.forEach((bill) => {
            const list = Array.isArray(bill.product_list) ? bill.product_list : [];
            list.forEach((entry) => {
              const match = String(entry).match(
                /^(.+?)\s*\(Qty:\s*(\d+),\s*Amount:\s*([0-9.]+)\)$/i
              );
              if (match) {
                const itemName = match.at(1)?.trim() || "";
                const qty = parseInt(match.at(2) || "1", 10) || 1;
                const amt = parseFloat(match.at(3) || "0") || 0;
                const unitPrice = qty > 0 ? amt / qty : amt;

                if (itemName && !productMap.has(itemName.toLowerCase())) {
                  productMap.set(itemName.toLowerCase(), {
                    name: itemName,
                    price: unitPrice,
                    status: "In Stock",
                  });
                }
              }
            });
          });
        }
      } catch {
        // Silent fallback if backend is offline
      }

      // ২. ইউজারের যোগ করা বা এডিট করা কাস্টম প্রোডাক্ট (localStorage) যুক্ত করা
      try {
        const savedCustom = JSON.parse(localStorage.getItem("crm_inventory_items") || "[]");
        if (Array.isArray(savedCustom)) {
          savedCustom.forEach((item) => {
            if (item && item.name) {
              productMap.set(String(item.name).toLowerCase(), {
                name: item.name,
                sku: item.sku,
                price: Number(item.price || 0),
                status: item.status || "In Stock",
              });
            }
          });
        }
      } catch {
        // Silent fallback if localStorage is invalid
      }

      const finalList = Array.from(productMap.values()).map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        sku: item.sku || `PRD-${1001 + idx}`,
        price: Number(item.price || 0),
        status: item.status || "In Stock",
      }));

      setProducts(finalList);
      setLoading(false);
    };

    fetchDynamicProducts();
  }, [getAuthHeaders]);

  const syncStorage = (updatedList) => {
    setProducts(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_inventory_items", JSON.stringify(updatedList));
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = {
      id: Date.now(),
      name: newName.trim(),
      sku: newSku.trim() || `PRD-${1001 + products.length}`,
      price: parseFloat(newPrice) || 0,
      status: newStatus,
    };
    syncStorage([...products, created]);
    setShowAddModal(false);
    setNewName("");
    setNewSku("");
    setNewPrice("");
    setNewStatus("In Stock");
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditPrice(String(prod.price));
    setEditStatus(prod.status);
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim()) return;
    const updated = products.map((p) =>
      p.id === editingProduct.id
        ? {
            ...p,
            name: editName.trim(),
            price: parseFloat(editPrice) || 0,
            status: editStatus,
          }
        : p
    );
    syncStorage(updated);
    setEditingProduct(null);
  };

  const handleRemoveProduct = (id) => {
    const updated = products.filter((p) => p.id !== id);
    syncStorage(updated);
    setEditingProduct(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            Product Inventory ({products.length})
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Live inventory extracted from scanned bills & custom product catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-100 transition cursor-pointer"
        >
          + Add Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-200">
              <th className="py-3 px-6">Product Name</th>
              <th className="py-3 px-6">SKU / Code</th>
              <th className="py-3 px-6">Price</th>
              <th className="py-3 px-6">Stock Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Loading products from scanned bills...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  No products found yet. Scan a bill or add a product.
                </td>
              </tr>
            ) : (
              products.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50/60 transition">
                  <td className="py-4 px-6 font-bold text-gray-900">{prod.name}</td>
                  <td className="py-4 px-6 font-semibold text-gray-600">{prod.sku}</td>
                  <td className="py-4 px-6 text-gray-800 font-medium">
                    ${Number(prod.price || 0).toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        prod.status === "In Stock"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : prod.status === "Low Stock"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      {prod.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      Edit/Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Product</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900"
                required
              />
              <input
                type="text"
                placeholder="SKU Code (Optional)"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900"
                required
              />
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white"
              >
                <option value="In Stock" className="text-gray-900 bg-white">
                  In Stock
                </option>
                <option value="Low Stock" className="text-gray-900 bg-white">
                  Low Stock
                </option>
                <option value="Out of Stock" className="text-gray-900 bg-white">
                  Out of Stock
                </option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Remove Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Edit Product</h3>
            <p className="text-xs text-gray-500 mb-4">SKU: {editingProduct.sku}</p>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price ($)"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900"
                required
              />
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white"
              >
                <option value="In Stock" className="text-gray-900 bg-white">
                  In Stock
                </option>
                <option value="Low Stock" className="text-gray-900 bg-white">
                  Low Stock
                </option>
                <option value="Out of Stock" className="text-gray-900 bg-white">
                  Out of Stock
                </option>
              </select>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(editingProduct.id)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Remove
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}