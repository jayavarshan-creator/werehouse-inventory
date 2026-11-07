import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Boxes, 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  RefreshCw,
  Cpu,
  ArrowUpDown
} from 'lucide-react';

export default function InventoryView({ onStockChange }) {
  const { role, token } = useAuth();
  
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [sortBy, setSortBy] = useState('name_asc');

  // Modal State for Add / Edit Item
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Controlled Form State (Unit 2 - React Forms with event.preventDefault)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Microcontrollers',
    unit: 'pcs',
    unitPrice: '',
    currentStock: '',
    reorderLevel: '20',
    warehouseId: '',
    supplierId: '',
    rfidTag: '',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Categories list
  const categories = [
    'Microcontrollers',
    'Sensors',
    'Actuators',
    'RFID & Scanner',
    'Packaging',
    'Electronics',
    'General'
  ];

  // Fetch Items, Warehouses, and Suppliers from Express Backend
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Warehouses
      const whRes = await fetch('/api/warehouses');
      const whData = await whRes.json();
      if (whData.success) {
        setWarehouses(whData.data);
      }

      // 2. Fetch Suppliers
      const supRes = await fetch('/api/suppliers');
      const supData = await supRes.json();
      if (supData.success) {
        setSuppliers(supData.data);
      }

      // 3. Fetch Items with query params
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedWarehouse !== 'ALL') params.append('warehouseId', selectedWarehouse);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (lowStockFilter) params.append('lowStockOnly', 'true');
      if (sortBy) params.append('sortBy', sortBy);

      const itemsRes = await fetch(`/api/items?${params.toString()}`);
      const itemsData = await itemsRes.json();

      if (itemsData.success) {
        setItems(itemsData.data);
      } else {
        throw new Error(itemsData.message || 'Failed to retrieve item records');
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
      setError(err.message || 'Error communicating with backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedWarehouse, selectedCategory, lowStockFilter, sortBy]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormError('');
    setFormData({
      sku: '',
      name: '',
      category: 'Microcontrollers',
      unit: 'pcs',
      unitPrice: '',
      currentStock: '50',
      reorderLevel: '20',
      warehouseId: warehouses.length > 0 ? warehouses[0]._id : '',
      supplierId: suppliers.length > 0 ? suppliers[0]._id : '',
      rfidTag: 'E280116060000' + Math.floor(100 + Math.random() * 900),
      description: ''
    });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormError('');
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      unitPrice: item.unitPrice,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      warehouseId: item.warehouseId,
      supplierId: item.supplierId || '',
      rfidTag: item.rfidTag || '',
      description: item.description || ''
    });
    setShowModal(true);
  };

  // Controlled Form submission using event.preventDefault() (Unit 2 & Image 1 requirement)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    // College Student Simple Validation
    if (!formData.sku.trim()) {
      setFormError('Please enter an SKU (Stock Keeping Unit).');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('Please enter an Item Name.');
      return;
    }
    if (!formData.warehouseId) {
      setFormError('Please select a storage Warehouse.');
      return;
    }
    if (Number(formData.currentStock) < 0) {
      setFormError('Current stock cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const url = editingItem ? `/api/items/${editingItem._id}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Operation failed');
      }

      setSuccessMsg(editingItem ? 'Item updated successfully!' : 'New stock item created successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowModal(false);
      loadData();
      if (onStockChange) onStockChange();
    } catch (err) {
      setFormError(err.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  };

  // Delete item handler
  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete item "${itemName}"?`)) return;

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Delete operation failed');
      }

      setSuccessMsg(`Item "${itemName}" removed successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadData();
      if (onStockChange) onStockChange();
    } catch (err) {
      setError(err.message || 'Failed to delete item.');
    }
  };

  const canEdit = role === 'Admin' || role === 'Warehouse Manager';

  return (
    <div className="space-y-4">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-wide uppercase">
              Warehouse Stock Items Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mongoose 'Item' Model • Manage SKU inventory, reorder thresholds & ESP32 RFID links
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Item
            </button>
          )}
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
            title="Reload data from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search, Filter & Sorting Bar - Silver, Black, Blue Theme */}
      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU, Name, or RFID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800"
          />
        </div>

        {/* Warehouse Filter */}
        <div>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((wh) => (
              <option key={wh._id} value={wh._id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800"
          >
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="stock_asc">Sort: Stock (Low to High)</option>
            <option value="stock_desc">Sort: Stock (High to Low)</option>
            <option value="price_desc">Sort: Price (High to Low)</option>
          </select>
        </div>

        {/* Low Stock Toggle Button */}
        <div>
          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`w-full py-1.5 px-3 rounded flex items-center justify-center gap-1.5 border font-medium transition-colors ${
              lowStockFilter
                ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${lowStockFilter ? 'text-amber-700' : 'text-slate-400'}`} />
            <span>Low Stock Reorder ({items.filter(i => i.isLowStock).length})</span>
          </button>
        </div>

      </div>

      {/* Items Table - Clean 2nd Year College Project Table */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                <th className="py-2.5 px-3 font-semibold">SKU</th>
                <th className="py-2.5 px-3 font-semibold">Item Name & Category</th>
                <th className="py-2.5 px-3 font-semibold">Warehouse</th>
                <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                <th className="py-2.5 px-3 font-semibold text-right">Current Stock</th>
                <th className="py-2.5 px-3 font-semibold text-right">Reorder Level</th>
                <th className="py-2.5 px-3 font-semibold">Stock Status</th>
                <th className="py-2.5 px-3 font-semibold">RFID Tag (ESP32)</th>
                {canEdit && <th className="py-2.5 px-3 font-semibold text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
                    Querying MongoDB collection...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="py-8 text-center text-slate-500">
                    No items found matching the selected filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    {/* SKU */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {item.sku}
                    </td>

                    {/* Name & Category */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.category} • {item.description}</div>
                    </td>

                    {/* Warehouse */}
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-800">{item.warehouseName}</span>
                      <div className="text-[10px] text-slate-400 font-mono">{item.warehouseCode}</div>
                    </td>

                    {/* Unit Price */}
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                      ${Number(item.unitPrice).toFixed(2)}
                    </td>

                    {/* Current Stock */}
                    <td className="py-2.5 px-3 text-right">
                      <span className={`font-mono text-sm font-bold ${item.isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.currentStock}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">{item.unit}</span>
                    </td>

                    {/* Reorder Level */}
                    <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                      {item.reorderLevel} {item.unit}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                          <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          Adequate
                        </span>
                      )}
                    </td>

                    {/* RFID Tag UID for ESP32 */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {item.rfidTag ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          <Cpu className="w-2.5 h-2.5 text-blue-600" />
                          {item.rfidTag}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    {canEdit && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Item"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {role === 'Admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item._id, item.name)}
                              className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Item (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit Item (Controlled Form with event.preventDefault()) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-lg overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-zinc-950 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  {editingItem ? 'Edit Item Details' : 'Register New Inventory Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controlled Form */}
            <form onSubmit={handleSubmitForm} className="p-4 space-y-3 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    placeholder="e.g. ESP32-WROOM-32D"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ESP32 NodeMCU Development Board"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5.50"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reorder Level *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="20"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Warehouse Location *
                  </label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Warehouse --</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Supplier
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ESP32 RFID Tag UID (for Hardware Scanner)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. E280116060000204"
                    value={formData.rfidTag}
                    onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rfidTag: 'TAG-' + Math.floor(100000 + Math.random() * 900000) })}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 whitespace-nowrap text-[11px]"
                  >
                    Generate Tag
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional item technical specs or handling notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors shadow-xs"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
