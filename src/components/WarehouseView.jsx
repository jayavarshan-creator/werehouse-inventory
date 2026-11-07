import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Warehouse, 
  Plus, 
  Trash2, 
  MapPin, 
  Users, 
  BarChart3, 
  Check, 
  X, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function WarehouseView({ onWarehouseChange }) {
  const { role, token } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for creating warehouse
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    capacity: 5000,
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWarehouses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/warehouses');
      const data = await res.json();
      if (data.success) {
        setWarehouses(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch warehouse list');
      }
    } catch (err) {
      setError(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.code.trim()) {
      setFormError('Please enter a warehouse code (e.g. WH-EAST).');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Please enter a warehouse name.');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Please provide a physical location.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not create warehouse');
      }

      setSuccessMsg('Warehouse registered successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      setFormData({ code: '', name: '', location: '', capacity: 5000, description: '' });
      fetchWarehouses();
      if (onWarehouseChange) onWarehouseChange();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete warehouse facility "${name}"?`)) return;

    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Delete failed');
      }
      setSuccessMsg(`Warehouse "${name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchWarehouses();
      if (onWarehouseChange) onWarehouseChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const canAdd = role === 'Admin' || role === 'Warehouse Manager';

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-wide uppercase">
              Warehouse Facility Locations
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mongoose 'Warehouse' Model • Capacity allocation & physical depot tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAdd && (
            <button
              type="button"
              onClick={() => { setShowModal(true); setFormError(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Facility
            </button>
          )}
          <button
            type="button"
            onClick={fetchWarehouses}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
            title="Reload warehouses"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>
        </div>
      )}

      {/* Warehouses Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((wh) => (
          <div key={wh._id} className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm flex flex-col justify-between">
            <div>
              {/* Header: Code & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    {wh.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{wh.name}</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {wh.status}
                </span>
              </div>

              {/* Location & Details */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{wh.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Manager: <strong className="text-slate-800">{wh.managerName}</strong></span>
                </div>
                {wh.description && (
                  <p className="text-[11px] text-slate-500 pt-1 italic">
                    "{wh.description}"
                  </p>
                )}
              </div>

              {/* Capacity & Occupancy Progress */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">Occupancy</span>
                  <span className="font-bold text-slate-900">
                    {wh.totalStoredUnits} / {wh.capacity.toLocaleString()} units ({wh.occupancyPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      wh.occupancyPercentage > 85 ? 'bg-red-500' : wh.occupancyPercentage > 60 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, wh.occupancyPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            {role === 'Admin' && (
              <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(wh._id, wh.name)}
                  className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Facility
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-md overflow-hidden">
            <div className="bg-zinc-950 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-blue-400" />
                Register New Warehouse Facility
              </h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="p-4 space-y-3 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warehouse Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-SOUTH"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Coastal Fulfillment Depot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 12, Export Zone, Port City"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Max Capacity (Units) *</label>
                <input
                  type="number"
                  min="100"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Facility specifications (cold storage, hazardous material, general)..."
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
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
                >
                  {saving ? 'Saving...' : 'Add Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
