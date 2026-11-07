import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  FileInput, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

export default function TransferView({ onTransferUpdate }) {
  const { role, token, user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    itemId: '',
    quantity: '10',
    notes: 'Urgent redistribution to balance regional stock'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [trfRes, whRes, itemsRes] = await Promise.all([
        fetch('/api/transfers'),
        fetch('/api/warehouses'),
        fetch('/api/items')
      ]);

      const trfData = await trfRes.json();
      const whData = await whRes.json();
      const itemsData = await itemsRes.json();

      if (trfData.success) setTransfers(trfData.data);
      if (whData.success) {
        setWarehouses(whData.data);
        if (whData.data.length >= 2 && !formData.fromWarehouseId) {
          setFormData(prev => ({
            ...prev,
            fromWarehouseId: whData.data[0]._id,
            toWarehouseId: whData.data[1]._id
          }));
        }
      }
      if (itemsData.success) {
        setItems(itemsData.data);
        if (itemsData.data.length > 0 && !formData.itemId) {
          setFormData(prev => ({ ...prev, itemId: itemsData.data[0]._id }));
        }
      }
    } catch (err) {
      setError(err.message || 'Error fetching transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      setFormError('Source and Destination warehouses must be different facilities.');
      return;
    }

    const qty = Number(formData.quantity);
    if (!qty || qty <= 0) {
      setFormError('Transfer quantity must be greater than zero.');
      return;
    }

    const item = items.find(i => i._id === formData.itemId);
    if (item && item.currentStock < qty) {
      setFormError(`Insufficient stock in origin warehouse. Available: ${item.currentStock} ${item.unit}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Transfer request failed');
      }

      setSuccessMsg('Transfer request created and pending approval.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      loadData();
      if (onTransferUpdate) onTransferUpdate();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (transferId, newStatus) => {
    try {
      const res = await fetch(`/api/transfers/${transferId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Status update failed');
      }

      setSuccessMsg(`Transfer status changed to ${newStatus}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
      if (onTransferUpdate) onTransferUpdate();
    } catch (err) {
      setError(err.message);
    }
  };

  const canApprove = role === 'Admin' || role === 'Warehouse Manager';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileInput className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-wide uppercase">
              Inter-Warehouse Stock Transfers
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mongoose 'Transfer' Model • Two-step authorization & physical location transit tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowModal(true); setFormError(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Request Transfer
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

      {/* Transfers Table */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                <th className="py-2.5 px-3 font-semibold">Transfer #</th>
                <th className="py-2.5 px-3 font-semibold">Source → Destination</th>
                <th className="py-2.5 px-3 font-semibold">Item & SKU</th>
                <th className="py-2.5 px-3 font-semibold text-right">Transfer Qty</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Requested By</th>
                <th className="py-2.5 px-3 font-semibold">Approval / Notes</th>
                <th className="py-2.5 px-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transfer orders created yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{t.transferNumber}</td>
                    
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                        <span>{t.fromWarehouseName}</span>
                        <ArrowRight className="w-3 h-3 text-blue-600" />
                        <span>{t.toWarehouseName}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{t.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.itemSku}</div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {t.quantity}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'APPROVED'
                          ? 'bg-blue-100 text-blue-800'
                          : t.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status === 'COMPLETED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {t.status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                        {t.status === 'CANCELLED' && <XCircle className="w-2.5 h-2.5" />}
                        {t.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600">
                      {t.requestedBy}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {t.approvedBy ? `Approved by ${t.approvedBy}` : t.notes || 'Pending review'}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {canApprove && t.status === 'PENDING' && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(t._id, 'COMPLETED')}
                            className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                            title="Complete & move inventory"
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(t._id, 'CANCELLED')}
                            className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded"
                            title="Reject transfer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {t.status === 'COMPLETED' && (
                        <span className="text-[11px] text-emerald-700 font-semibold">Stock Moved ✓</span>
                      )}
                      {t.status === 'CANCELLED' && (
                        <span className="text-[11px] text-slate-400">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-md overflow-hidden">
            <div className="bg-zinc-950 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <FileInput className="w-4 h-4 text-blue-400" />
                Initiate Inter-Warehouse Transfer
              </h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-4 space-y-3 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">From Warehouse *</label>
                  <select
                    required
                    value={formData.fromWarehouseId}
                    onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>{wh.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">To Warehouse *</label>
                  <select
                    required
                    value={formData.toWarehouseId}
                    onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stock Item *</label>
                <select
                  required
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                >
                  {items.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.sku} - {i.name} ({i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity to Transfer *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Justification</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                />
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
                  {submitting ? 'Submitting...' : 'Request Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
