import React, { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function SubmitBillView() {
  const [billId, setBillId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [printedDate, setPrintedDate] = useState('');
  const [productList, setProductList] = useState('');
  const [rawText, setRawText] = useState('');
  const [tempImagePath, setTempImagePath] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files.item(0) : null;
    if (!file) return;

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError('File size exceeds 10MB limit.');
      e.target.value = '';
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan-bill/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBillId(data.bill_id || '');
        setTotalAmount(data.total_amount || '');
        setCustomerName(data.customer_name || '');
        setMobileNumber(data.mobile || '');
        setProductList(data.product_list || '');
        setPrintedDate(data.date_time || data.printed_datetime || '');
        setRawText(data.raw_text || '');
        setTempImagePath(data.temp_image_path || '');

        setMessage('Bill scanned successfully! Please verify the details below.');
      } else {
        let errMsg = 'Failed to scan bill.';
        try {
          const errData = await response.json();
          errMsg = errData.detail || errData.error || errMsg;
        } catch {
          // Non-JSON error response
        }
        setError(`${errMsg} (Status: ${response.status})`);
      }
    } catch {
      setError('Network error. Make sure Django backend is running on port 8000 and CORS is enabled.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      bill_id: billId,
      total_amount: totalAmount,
      customer_name: customerName,
      mobile: mobileNumber,
      printed_datetime: printedDate,
      date_time: printedDate,
      product_list: productList,
      temp_image_path: tempImagePath,
      status: 'Pending',
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/save-bill/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage('Bill saved as Pending successfully!');
        setBillId('');
        setTotalAmount('');
        setCustomerName('');
        setMobileNumber('');
        setPrintedDate('');
        setProductList('');
        setRawText('');
        setTempImagePath('');
      } else {
        let errMsg = 'Failed to save bill.';
        try {
          const errData = await response.json();
          errMsg = errData.detail || errData.error || errMsg;
        } catch {
          // Non-JSON error response
        }
        setError(`${errMsg} (Status: ${response.status})`);
      }
    } catch {
      setError('Network error while saving. Make sure Django backend is running on port 8000.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto font-sans">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8 p-6 border-2 border-dashed border-gray-200 rounded-xl text-center hover:bg-gray-50 transition relative">
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-xl">
              📄
            </div>
            <h3 className="font-bold text-gray-800">Click to upload or drag and drop bill image</h3>
            <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 10MB</p>
            {loading && (
              <p className="text-indigo-600 font-semibold text-sm mt-2 animate-pulse">
                Scanning bill with AI OCR...
              </p>
            )}
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Bill ID
              </label>
              <input
                type="text"
                value={billId}
                onChange={(e) => setBillId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Total Amount ($)
              </label>
              <input
                type="text"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Printed Date & Time
              </label>
              <input
                type="text"
                value={printedDate}
                onChange={(e) => setPrintedDate(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Product List (Item, Qty, Amount)
              </label>
              <textarea
                value={productList}
                onChange={(e) => setProductList(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white outline-none h-40 resize-none font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Bill as Pending'}
            </button>
          </div>
        </form>

        {rawText && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Raw OCR Output (For Verification)
            </label>
            <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 whitespace-pre-wrap font-mono">
              {rawText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}