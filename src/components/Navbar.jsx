import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Boxes, 
  Warehouse, 
  ArrowLeftRight, 
  FileInput, 
  FileCheck, 
  Truck, 
  Cpu, 
  GraduationCap, 
  LogOut, 
  UserCheck, 
  RefreshCw,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onResetDemo }) {
  const { user, role, logout, loginAsDefault } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleQuickRoleSwitch = async (newRole) => {
    setRoleMenuOpen(false);
    await loginAsDefault(newRole);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all inventory records back to initial college demo values?')) return;
    setResetting(true);
    try {
      await onResetDemo();
    } finally {
      setResetting(false);
    }
  };

  // Student-friendly navigation items
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stock Items', icon: Boxes },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'movements', label: 'Stock IN/OUT', icon: ArrowLeftRight },
    { id: 'transfers', label: 'Transfers', icon: FileInput },
    { id: 'receipts', label: 'Purchase Receipts', icon: FileCheck },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'esp32', label: 'ESP32 IoT Node', icon: Cpu, badge: 'IoT LIVE' },
    { id: 'viva', label: 'Viva & Syllabus', icon: GraduationCap, highlight: true }
  ];

  return (
    <header className="bg-zinc-950 text-slate-100 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Top Bar: Project Identification & User Credentials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm border border-blue-400">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wide text-white">Smart Warehouse System</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700">
                  Topic #26
                </span>
                <span className="hidden md:inline-flex text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  MERN + ESP32
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Second Year B.E. Internal Marks Project • React JSX • Express REST • MongoDB • ESP32
              </p>
            </div>
          </div>

          {/* Right Action Tools: Role Switcher & User Status */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Role Switcher for Oral Viva Presentation */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-200 transition-colors"
                title="Switch role to demonstrate different permissions to the teacher"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">Role:</span>
                <span className="font-semibold text-blue-300">{role}</span>
                <span className="text-slate-500 text-[10px]">▼</span>
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-md shadow-lg bg-zinc-900 border border-slate-700 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Test Role (Internal Marks Demo)
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('Admin')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${role === 'Admin' ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-300'}`}
                  >
                    <span>1. Admin (Full Access)</span>
                    {role === 'Admin' && <span className="text-blue-400">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('Warehouse Manager')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${role === 'Warehouse Manager' ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-300'}`}
                  >
                    <span>2. Warehouse Manager</span>
                    {role === 'Warehouse Manager' && <span className="text-blue-400">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSwitch('Storekeeper')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 ${role === 'Storekeeper' ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-300'}`}
                  >
                    <span>3. Storekeeper (Inventory Floor)</span>
                    {role === 'Storekeeper' && <span className="text-blue-400">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Reset Demo Button */}
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="p-1.5 rounded text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
              title="Reset sample inventory data to defaults"
            >
              <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* Current User Name */}
            {user && (
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200">{user.name}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-none text-xs">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t font-medium whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'bg-slate-800 text-blue-400 border-blue-500 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900 border-transparent'
                } ${tab.highlight ? 'text-blue-300 font-semibold' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-mono animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
