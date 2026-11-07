import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  Check, 
  X, 
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';

export default function SuppliersView() {
  const { role, token } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    itemsSupplied: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch suppliers');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Supplier name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Supplier contact email is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to register supplier');
      }

      setSuccessMsg('Supplier registered successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      setFormData({ code: '', name: '', contactPerson: '', email: '', phone: '', address: '', itemsSupplied: '' });
      fetchSuppliers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;

    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Delete failed');
      }
      setSuccessMsg(`Supplier "${name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchSuppliers();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.itemsSupplied && s.itemsSupplied.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-wide uppercase">
              Registered Vendors & Suppliers
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mongoose 'Supplier' Model • Manage component sources, contacts, and procurement channels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowModal(true); setFormError(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Supplier
          </button>
          <button
            type="button"
            onClick={fetchSuppliers}
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

      {/* Search */}
      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm max-w-sm text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name or parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s._id} className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {s.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{s.name}</h3>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">Contact:</span>
                  <span>{s.contactPerson || 'Sales Team'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-blue-600">{s.email}</span>
                </div>
                {s.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{s.address}</span>
                  </div>
                )}
                {s.itemsSupplied && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
                    <Package className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Supplies:</strong> {s.itemsSupplied}</span>
                  </div>
                )}
              </div>
            </div>

            {role === 'Admin' && (
              <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(s._id, s.name)}
                  className="text-[11px] text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-md overflow-hidden">
            <div className="bg-zinc-950 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Register Vendor / Supplier
              </h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-4 space-y-3 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SUP-TEXAS"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Texas Instruments Dist"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Representative</label>
                  <input
                    type="text"
                    placeholder="e.g. Alice Smith"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sales@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 555-0199"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Items / Products Supplied</label>
                <input
                  type="text"
                  placeholder="e.g. Microcontrollers, RF Modules, PCB boards"
                  value={formData.itemsSupplied}
                  onChange={(e) => setFormData({ ...formData, itemsSupplied: e.target.value })}
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
                  {saving ? 'Saving...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
