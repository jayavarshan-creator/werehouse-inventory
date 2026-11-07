import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import DashboardView from './components/DashboardView.jsx';
import InventoryView from './components/InventoryView.jsx';
import WarehouseView from './components/WarehouseView.jsx';
import StockMovementView from './components/StockMovementView.jsx';
import TransferView from './components/TransferView.jsx';
import PurchaseReceiptView from './components/PurchaseReceiptView.jsx';
import SuppliersView from './components/SuppliersView.jsx';
import Esp32LiveSimulator from './components/Esp32LiveSimulator.jsx';
import VivaPrepGuide from './components/VivaPrepGuide.jsx';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleResetDemoData = async () => {
    try {
      const res = await fetch('/api/system/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Sample demo inventory reset to initial college values!');
        handleDataChange();
      }
    } catch (err) {
      alert('Reset failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Navigation Bar (Silver, Black & Blue Theme) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemoData}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            onStockChange={handleDataChange}
          />
        )}

        {activeTab === 'warehouses' && (
          <WarehouseView
            onWarehouseChange={handleDataChange}
          />
        )}

        {activeTab === 'movements' && (
          <StockMovementView
            onStockChange={handleDataChange}
          />
        )}

        {activeTab === 'transfers' && (
          <TransferView
            onTransferUpdate={handleDataChange}
          />
        )}

        {activeTab === 'receipts' && (
          <PurchaseReceiptView
            onReceiptCreated={handleDataChange}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView />
        )}

        {activeTab === 'esp32' && (
          <Esp32LiveSimulator
            onStockUpdated={handleDataChange}
          />
        )}

        {activeTab === 'viva' && (
          <VivaPrepGuide />
        )}
      </main>

      {/* College Project Submission Footer */}
      <footer className="bg-zinc-950 text-slate-400 border-t border-slate-800 py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-bold text-slate-200">
              Smart Warehouse Inventory System (Topic #26)
            </div>
            <p className="text-[11px] text-slate-500">
              Department of Computer Science & Engineering • II Year Internal Project
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              React JSX + Vite
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              Node.js Express REST
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              MongoDB Mongoose ODM
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
              ESP32 WiFi & RFID Node
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
