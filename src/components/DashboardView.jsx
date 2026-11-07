import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  DollarSign, 
  Warehouse, 
  Cpu, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  CheckCircle2, 
  RefreshCw,
  PlusCircle
} from 'lucide-react';

export default function DashboardView({ onNavigate, refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard stats from Express API
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard metrics. Status: ' + res.status);
      }
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        throw new Error(json.message || 'Server returned an error');
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Could not connect to backend server. Make sure Node.js server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading Warehouse Inventory System metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* College Project Submission Notice Banner */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-sm font-bold tracking-wide uppercase text-blue-400">
              Project #26: Warehouse Inventory System
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              MERN Stack + ESP32 NodeMCU
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Student Internal Project: Manage warehouses & items, record receipts/issues, monitor reorder level alerts, and process IoT RFID scans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate('esp32')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5" />
            Test ESP32 Scanner
          </button>
        </div>
      </div>

      {/* Error state if server call fails */}
      {error && (
        <div className="bg-red-950/80 border border-red-800 text-red-200 p-3 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            type="button"
            onClick={fetchDashboardData}
            className="text-xs underline font-medium hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats Cards - Silver, Black, Blue Palette */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Units In Stock */}
          <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stock Units</span>
              <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{stats.totalUnitsInStock}</span>
              <span className="text-xs text-slate-500">across {stats.totalItemsCount} SKUs</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-600 font-medium">
              Real-time Mongoose count
            </div>
          </div>

          {/* Low Stock Warning Card */}
          <div className={`border rounded-lg p-4 shadow-sm ${stats.lowStockAlertsCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-300'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Reorder Level Alerts</span>
              <div className={`w-8 h-8 rounded flex items-center justify-center ${stats.lowStockAlertsCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${stats.lowStockAlertsCount > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                {stats.lowStockAlertsCount}
              </span>
              <span className="text-xs text-slate-500">items need reordering</span>
            </div>
            <div className="mt-2 text-[11px] font-medium text-amber-700">
              {stats.lowStockAlertsCount > 0 ? '⚠️ Stock level <= reorderLevel' : '✓ All items above threshold'}
            </div>
          </div>

          {/* Total Inventory Valuation */}
          <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Inventory Value</span>
              <div className="w-8 h-8 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">${stats.totalInventoryValueUSD.toLocaleString()}</span>
              <span className="text-xs text-slate-500">USD</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Σ (currentStock × unitPrice)
            </div>
          </div>

          {/* ESP32 IoT Node Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm text-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">ESP32 IoT Node</span>
              <div className="w-8 h-8 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-lg font-bold text-emerald-400">ONLINE</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>RFID & DHT11 Active</span>
              <span className="text-blue-400 font-mono text-[10px]">192.168.1.145</span>
            </div>
          </div>

        </div>
      )}

      {/* Critical Reorder Level Warnings - Required in Image 1: "maintain reorder levels" */}
      {stats && stats.lowStockItems && stats.lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold uppercase text-amber-900 tracking-wider">
                Low Stock Threshold Warning ({stats.lowStockItems.length} items)
              </h3>
            </div>
            <span className="text-xs text-amber-700">Immediate purchase order recommended</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockItems.map((item) => (
              <div key={item._id} className="bg-white border border-amber-300 rounded p-3 text-xs flex justify-between items-center shadow-xs">
                <div>
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-bold text-red-600">Current: {item.currentStock} {item.unit}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600">Reorder At: {item.reorderLevel} {item.unit}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('movements')}
                  className="px-2.5 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Buttons for Warehouse Operations */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Core Warehouse Workflows (Quick Actions)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('movements')}
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-800 text-xs font-medium transition-all group"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Stock IN (Receipt)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('movements')}
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-800 text-xs font-medium transition-all group"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>Stock OUT (Issue)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('transfers')}
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-800 text-xs font-medium transition-all group"
          >
            <Warehouse className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Inter-Warehouse Transfer</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('esp32')}
            className="flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-800 text-xs font-medium transition-all group"
          >
            <Cpu className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <span>ESP32 RFID Tap & Scan</span>
          </button>
        </div>
      </div>

      {/* Recent Stock Movement Audit Trail */}
      {stats && stats.recentMovements && (
        <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Stock Movement History (Audit Trail)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('movements')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All Movements →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-semibold">Movement #</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold">Item & SKU</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-2.5 px-4 font-semibold">Source</th>
                  <th className="py-2.5 px-4 font-semibold">Reason / Reference</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {stats.recentMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentMovements.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-4 font-mono font-medium text-slate-900">{m.movementNumber}</td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          m.type === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.type === 'OUT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {m.type === 'IN' ? '↓ IN' : m.type === 'OUT' ? '↑ OUT' : '⟳ ADJ'}
                        </span>
                      </td>
                      <td className="py-2 px-4 font-medium text-slate-900">
                        {m.itemName || m.itemId}
                      </td>
                      <td className="py-2 px-4 font-bold text-right text-slate-900">{m.quantity}</td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          m.source === 'ESP32_Scanner'
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.source === 'ESP32_Scanner' && <Cpu className="w-2.5 h-2.5" />}
                          {m.source || 'Manual'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-500 max-w-xs truncate" title={m.reason}>
                        {m.reason}
                      </td>
                      <td className="py-2 px-4 text-right text-slate-400 text-[11px]">
                        {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Unit Reference Bar (From Syllabus Image) */}
      <div className="p-3 bg-slate-200 border border-slate-300 rounded text-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-slate-900">
          Course Syllabus Mapping:
        </span>
        <span className="text-[11px] text-slate-600">
          Unit 1: Intelligent Architecture • Unit 2: React JSX & Hooks • Unit 3: Express & JWT • Unit 4: Mongoose Schemas • Unit 5: Deployment & IoT
        </span>
        <button
          type="button"
          onClick={() => onNavigate('viva')}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
        >
          Open Viva Q&A Guide →
        </button>
      </div>

    </div>
  );
}
