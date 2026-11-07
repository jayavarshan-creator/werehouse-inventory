import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  FileCheck, 
  Plus, 
  Trash2, 
  DollarSign, 
  Check, 
  X, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function PurchaseReceiptView({ onReceiptCreated }) {
  const { role, token, user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptLines, setReceiptLines] = useState([
    { itemId: '', quantity: 20, unitCost: 5.50 }
  ]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prRes, supRes, whRes, itemsRes] = await Promise.all([
        fetch('/api/purchase-receipts'),
        fetch('/api/suppliers'),
        fetch('/api/warehouses'),
        fetch('/api/items')
      ]);

      const prData = await prRes.json();
      const supData = await supRes.json();
      const whData = await whRes.json();
      const itemsData = await itemsRes.json();

      if (prData.success) setReceipts(prData.data);
      if (supData.success) {
        setSuppliers(supData.data);
        if (supData.data.length > 0 && !supplierId) setSupplierId(supData.data[0]._id);
      }
      if (whData.success) {
        setWarehouses(whData.data);
        if (whData.data.length > 0 && !warehouseId) setWarehouseId(whData.data[0]._id);
      }
      if (itemsData.success) {
        setItems(itemsData.data);
        if (itemsData.data.length > 0 && !receiptLines[0].itemId) {
          setReceiptLines([{ itemId: itemsData.data[0]._id, quantity: 20, unitCost: itemsData.data[0].unitPrice }]);
        }
      }
    } catch (err) {
      setError(err.message || 'Error loading purchase receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    const defaultItem = items[0];
    setReceiptLines([
      ...receiptLines,
      { itemId: defaultItem ? defaultItem._id : '', quantity: 10, unitCost: defaultItem ? defaultItem.unitPrice : 1.00 }
    ]);
  };

  const handleRemoveLine = (idx) => {
    if (receiptLines.length === 1) return;
    setReceiptLines(receiptLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx, field, value) => {
    const updated = [...receiptLines];
    updated[idx][field] = value;
    if (field === 'itemId') {
      const item = items.find(i => i._id === value);
      if (item) updated[idx].unitCost = item.unitPrice;
    }
    setReceiptLines(updated);
  };

  const calculateSubtotal = () => {
    return receiptLines.reduce((acc, line) => {
      const q = Number(line.quantity) || 0;
      const c = Number(line.unitCost) || 0;
      return acc + (q * c);
    }, 0);
  };

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!supplierId || !warehouseId) {
      setFormError('Supplier and Warehouse destination are required.');
      return;
    }

    const invalid = receiptLines.some(l => !l.itemId || Number(l.quantity) <= 0);
    if (invalid) {
      setFormError('All line items must have a valid item selected and quantity > 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/purchase-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplierId,
          warehouseId,
          receiptItems: receiptLines
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create purchase receipt');
      }

      setSuccessMsg('Goods inward purchase receipt logged and stock updated!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      loadData();
      if (onReceiptCreated) onReceiptCreated();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-wide uppercase">
              Purchase Receipts (Goods Inward Notes)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mongoose 'PurchaseReceipt' Model • Inward supplier shipments & inventory auto-increment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowModal(true); setFormError(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Purchase Receipt
          </button>
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>
        </div>
      )}

      {/* Receipts Table */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                <th className="py-2.5 px-3 font-semibold">Receipt #</th>
                <th className="py-2.5 px-3 font-semibold">Supplier</th>
                <th className="py-2.5 px-3 font-semibold">Warehouse Destination</th>
                <th className="py-2.5 px-3 font-semibold">Received Items</th>
                <th className="py-2.5 px-3 font-semibold text-right">Total Amount</th>
                <th className="py-2.5 px-3 font-semibold">Received By</th>
                <th className="py-2.5 px-3 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No purchase receipts generated yet.
                  </td>
                </tr>
              ) : (
                receipts.map((pr) => (
                  <tr key={pr._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{pr.receiptNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{pr.supplierName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{pr.warehouseName}</td>
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        {pr.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-slate-800">
                            • {it.quantity}x <span className="font-medium">{it.itemName || it.itemSku}</span> @ ${Number(it.unitCost).toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      ${Number(pr.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{pr.receivedBy}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                      {new Date(pr.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-lg overflow-hidden">
            <div className="bg-zinc-950 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                Record Supplier Goods Inward (PO)
              </h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateReceipt} className="p-4 space-y-3 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                  >
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receiving Warehouse *</label>
                  <select
                    required
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                  >
                    {warehouses.map(wh => (
                      <option key={wh._id} value={wh._id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Receipt Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item Line
                  </button>
                </div>

                {receiptLines.map((line, idx) => (
                  <div key={idx} className="p-2 border border-slate-200 rounded bg-slate-50 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-900"
                      >
                        {items.map(i => (
                          <option key={i._id} value={i._id}>{i.sku} - {i.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={line.unitCost}
                        onChange={(e) => handleLineChange(idx, 'unitCost', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 font-mono"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={receiptLines.length === 1}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="text-right text-xs pt-1 font-bold text-slate-900">
                  Total Calculated Amount: ${calculateSubtotal().toFixed(2)}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
                >
                  {submitting ? 'Processing...' : 'Post Purchase Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
