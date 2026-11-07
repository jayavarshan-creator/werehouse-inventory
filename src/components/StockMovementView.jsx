import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function StockMovementView({ onStockChange }) {
  const { role, token, user } = useAuth();
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Controlled Form State for Recording Stock IN / OUT / ADJ
  const [movementType, setMovementType] = useState('IN');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [referenceNumber, setReferenceNumber] = useState('PO-2026-');
  const [reason, setReason] = useState('Replenishment batch received');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [movRes, itemsRes, whRes] = await Promise.all([
        fetch('/api/stock-movements'),
        fetch('/api/items'),
        fetch('/api/warehouses')
      ]);

      const movData = await movRes.json();
      const itemsData = await itemsRes.json();
      const whData = await whRes.json();

      if (movData.success) setMovements(movData.data);
      if (itemsData.success) {
        setItems(itemsData.data);
        if (!selectedItemId && itemsData.data.length > 0) {
          setSelectedItemId(itemsData.data[0]._id);
        }
      }
      if (whData.success) setWarehouses(whData.data);
    } catch (err) {
      setError(err.message || 'Failed to load stock movements data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update default reference & reason when movement type changes
  const handleTypeChange = (type) => {
    setMovementType(type);
    if (type === 'IN') {
      setReferenceNumber('PO-2026-' + Math.floor(100 + Math.random() * 900));
      setReason('Inward stock receipt from supplier');
    } else if (type === 'OUT') {
      setReferenceNumber('ISSUE-WO-' + Math.floor(1000 + Math.random() * 9000));
      setReason('Dispatched for lab assembly & production');
    } else {
      setReferenceNumber('AUDIT-ADJ-' + Math.floor(10 + Math.random() * 90));
      setReason('Physical warehouse cycle-count stock correction');
    }
  };

  // Controlled Form Submission using event.preventDefault()
  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    setFormError('');

    const qty = Number(quantity);
    if (!selectedItemId) {
      setFormError('Please select a stock item.');
      return;
    }
    if (!qty || qty <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }

    const currentItem = items.find(i => i._id === selectedItemId);
    if (movementType === 'OUT' && currentItem && currentItem.currentStock < qty) {
      setFormError(`Insufficient stock! Item "${currentItem.name}" only has ${currentItem.currentStock} ${currentItem.unit} available.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: selectedItemId,
          type: movementType,
          quantity: qty,
          referenceNumber,
          reason
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Stock operation failed');
      }

      setSuccessMsg(data.message);
      setTimeout(() => setSuccessMsg(''), 5000);
      setQuantity('10');
      loadData();
      if (onStockChange) onStockChange();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItemObj = items.find(i => i._id === selectedItemId);

  // Filtered movements list
  const filteredMovements = movements.filter(m => {
    const matchesSearch = 
      m.movementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.itemName && m.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.itemSku && m.itemSku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-wide uppercase">
              Stock Movements (IN, OUT & Adjustments)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mongoose 'StockMovement' Model • Record receipts, issues & automated ESP32 scans
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors self-start sm:self-auto"
          title="Reload movements"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>
        </div>
      )}

      {/* Two Column Layout: Action Form (Left) & Audit History Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Record Stock Action Controlled Form */}
        <div className="bg-white border border-slate-300 rounded-lg shadow-sm p-4 h-fit">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 pb-2 border-b border-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            Record Stock Movement
          </h2>

          <form onSubmit={handleSubmitMovement} className="space-y-3 text-xs">
            {formError && (
              <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded">
                {formError}
              </div>
            )}

            {/* Movement Type Toggle */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Movement Type *
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleTypeChange('IN')}
                  className={`py-1.5 px-2 rounded text-xs font-semibold border flex items-center justify-center gap-1 transition-colors ${
                    movementType === 'IN'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3" />
                  Stock IN
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('OUT')}
                  className={`py-1.5 px-2 rounded text-xs font-semibold border flex items-center justify-center gap-1 transition-colors ${
                    movementType === 'OUT'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  Stock OUT
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('ADJUSTMENT')}
                  className={`py-1.5 px-2 rounded text-xs font-semibold border flex items-center justify-center gap-1 transition-colors ${
                    movementType === 'ADJUSTMENT'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Adjust
                </button>
              </div>
            </div>

            {/* Select Stock Item */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Item *
              </label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
              >
                {items.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.sku} - {i.name} ({i.currentStock} {i.unit} in stock)
                  </option>
                ))}
              </select>

              {/* Item Info Card */}
              {selectedItemObj && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 flex justify-between">
                  <span>Current Available: <strong className="text-slate-900">{selectedItemObj.currentStock} {selectedItemObj.unit}</strong></span>
                  <span>Warehouse: <strong>{selectedItemObj.warehouseName}</strong></span>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantity ({movementType === 'ADJUSTMENT' ? 'New Total Count' : 'Units'}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-mono text-sm font-bold"
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reference / PO / Work Order #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-mono"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason / Note *
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 px-4 rounded text-white font-bold transition-all shadow-sm ${
                movementType === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : movementType === 'OUT'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Processing Transaction...' : `Confirm Stock ${movementType}`}
            </button>
          </form>
        </div>

        {/* Audit Log Table (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Search & Filter Header */}
          <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search movement #, SKU, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1 w-full sm:w-auto">
              <span className="text-slate-500 text-[11px] font-medium mr-1">Type:</span>
              {['ALL', 'IN', 'OUT', 'ADJUSTMENT'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    filterType === t
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Audit History Records */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                    <th className="py-2.5 px-3 font-semibold">Movement #</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Item & SKU</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Qty</th>
                    <th className="py-2.5 px-3 font-semibold">Source</th>
                    <th className="py-2.5 px-3 font-semibold">Reference & Reason</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No movement audit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{m.movementNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.type === 'IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.type === 'OUT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {m.type === 'IN' ? '↓ IN' : m.type === 'OUT' ? '↑ OUT' : '⟳ ADJ'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          <div>{m.itemName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{m.itemSku}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-900">
                          {m.type === 'IN' ? `+${m.quantity}` : m.type === 'OUT' ? `-${m.quantity}` : m.quantity}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            m.source === 'ESP32_Scanner'
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.source === 'ESP32_Scanner' && <Cpu className="w-2.5 h-2.5" />}
                            {m.source || 'Manual'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                          <div className="font-mono text-[10px] text-slate-500 font-semibold">{m.referenceNumber}</div>
                          <div className="truncate text-[11px]">{m.reason}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">
                          {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
