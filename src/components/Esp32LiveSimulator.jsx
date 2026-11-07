import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Wifi, 
  Radio, 
  Terminal, 
  Code2, 
  Copy, 
  Check, 
  Play, 
  Thermometer, 
  Droplets, 
  Volume2, 
  AlertTriangle,
  RefreshCw,
  HardDrive
} from 'lucide-react';

export default function Esp32LiveSimulator({ onStockUpdated }) {
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [registeredRfids, setRegisteredRfids] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('simulator'); // 'simulator' | 'code' | 'wiring'

  // Simulator controls
  const [selectedTag, setSelectedTag] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [scanAction, setScanAction] = useState('IN');
  const [scanQty, setScanQty] = useState(1);
  const [temperature, setTemperature] = useState(23.5);
  const [humidity, setHumidity] = useState(48.0);
  const [scanning, setScanning] = useState(false);
  const [sendingTelemetry, setSendingTelemetry] = useState(false);

  // Serial Monitor logs (mimicking Arduino IDE Serial output at 115200 baud)
  const [serialLogs, setSerialLogs] = useState([
    '[BOOT] ESP32-WROOM-32D Dual-Core Xtensa LX6 @ 240MHz initialized',
    '[WIFI] Connecting to Warehouse_IoT_Mesh...',
    '[WIFI] Connected! Assigned IP: 192.168.1.145, Gateway: 192.168.1.1',
    '[SPI] Initializing MFRC522 RFID reader on VSPI (SCK=18, MOSI=23, MISO=19, SS=5)',
    '[DHT11] Climate sensor calibrated on GPIO 4',
    '[SYSTEM] Ready. Waiting for RFID tags at Gate #1...'
  ]);

  const [copied, setCopied] = useState(false);

  const fetchEspStatus = async () => {
    try {
      const res = await fetch('/api/esp32/status');
      const data = await res.json();
      if (data.success) {
        setDeviceStatus(data.device);
        setRecentLogs(data.recentLogs);
        setRegisteredRfids(data.registeredRfids);
        if (data.registeredRfids.length > 0 && !selectedTag) {
          setSelectedTag(data.registeredRfids[0].rfidTag);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ESP32 status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEspStatus();
  }, []);

  const addSerialLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setSerialLogs(prev => [...prev.slice(-35), `[${timestamp}] ${message}`]);
  };

  // Simulate RFID Card Tap on ESP32 Antenna
  const handleTriggerRfidScan = async () => {
    const tagToUse = customTag.trim() || selectedTag;
    if (!tagToUse) {
      alert('Please select or enter an RFID Tag UID');
      return;
    }

    setScanning(true);
    addSerialLog(`[RC522] ⚡ Card present on antenna coil! Reading UID...`);
    addSerialLog(`[RC522] UID extracted: ${tagToUse} (SAK=0x08, Type=MIFARE 1KB)`);
    addSerialLog(`[HTTP] Preparing POST request to http://192.168.1.100:3000/api/esp32/scan`);

    try {
      const res = await fetch('/api/esp32/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfidTag: tagToUse,
          scannerId: 'ESP32-GATE-NODE-01',
          warehouseCode: 'WH-CENTRAL',
          action: scanAction,
          quantity: scanQty
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addSerialLog(`[HTTP 200 OK] Response: ${data.message}`);
        addSerialLog(`[BUZZER] Triggering success tone (2000Hz, 150ms). GPIO 15 Green LED ON.`);
        if (data.item?.isLowStock) {
          addSerialLog(`[ALERT] ⚠️ Item stock dropped below reorder level (${data.item.currentStock} ${data.item.unit})!`);
        }
      } else {
        addSerialLog(`[HTTP ${res.status}] ${data.message || 'Scan rejected'}`);
        addSerialLog(`[BUZZER] Error double-beep (800Hz, 300ms).`);
      }

      fetchEspStatus();
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      addSerialLog(`[HTTP ERROR] Connection timeout: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  // Simulate DHT11 Climate Telemetry transmission
  const handleSendTelemetry = async () => {
    setSendingTelemetry(true);
    addSerialLog(`[DHT11] Reading sensor pin GPIO 4... Temp=${temperature}°C, Hum=${humidity}%`);
    addSerialLog(`[HTTP] Transmitting telemetry to /api/esp32/telemetry`);

    try {
      const res = await fetch('/api/esp32/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'ESP32-CLIMATE-01',
          warehouseCode: 'WH-COLD',
          temperature,
          humidity,
          batteryVoltage: 3.7
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addSerialLog(`[HTTP 200 OK] Telemetry logged. Server response: Condition=${data.systemStatus}, FanRelay=${data.fanRelay}`);
        if (data.fanRelay === 'ON') {
          addSerialLog(`[GPIO RELAY] ⚠️ High Temperature detected! Activating Cold Storage Ventilation Fan (Relay Pin HIGH).`);
        }
      }
      fetchEspStatus();
    } catch (err) {
      addSerialLog(`[ERROR] Telemetry send failed: ${err.message}`);
    } finally {
      setSendingTelemetry(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(arduinoCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const arduinoCodeSnippet = `/*
  Smart Warehouse Inventory System - ESP32 Node
  Second Year College Internal Project
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <DHT.h>

const char* WIFI_SSID     = "Warehouse_IoT_Mesh";
const char* WIFI_PASSWORD = "warehouse_secure_pass";
const char* SERVER_URL    = "http://192.168.1.100:3000";

#define SS_PIN    5
#define RST_PIN   22
#define DHT_PIN   4
#define BUZZER    2
#define GREEN_LED 15

MFRC522 rfid(SS_PIN, RST_PIN);
DHT dht(DHT_PIN, DHT11);

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  SPI.begin();
  rfid.PCD_Init();
  dht.begin();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

void loop() {
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String tagUID = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      tagUID += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      tagUID += String(rfid.uid.uidByte[i], HEX);
    }
    tagUID.toUpperCase();
    
    // HTTP POST to Node.js backend
    HTTPClient http;
    http.begin(String(SERVER_URL) + "/api/esp32/scan");
    http.addHeader("Content-Type", "application/json");
    String payload = "{\\"rfidTag\\":\\"" + tagUID + "\\",\\"action\\":\\"IN\\",\\"quantity\\":1}";
    int code = http.POST(payload);
    if (code == 200) tone(BUZZER, 2000, 150);
    http.end();
    rfid.PICC_HaltA();
  }
  delay(100);
}`;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <h1 className="text-base font-bold text-white tracking-wide uppercase">
              ESP32 Microcontroller IoT Inventory Node
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-semibold">
              HARDWARE SIMULATOR ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real ESP32 integration: Scans RFID MIFARE cards, reads DHT11 climate sensors & sends JSON REST calls to Node.js backend.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('simulator')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeSubTab === 'simulator' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Hardware Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('code')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeSubTab === 'code' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Arduino C++ Code (.ino)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('wiring')}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              activeSubTab === 'wiring' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pinout & Circuit
          </button>
        </div>
      </div>

      {activeSubTab === 'simulator' && (
        <div className="space-y-4">
          
          {/* Top Hardware Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-white border border-slate-300 rounded p-3 shadow-xs">
              <span className="text-slate-500 font-medium">Target Microcontroller</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">ESP32 NodeMCU-32S</div>
              <div className="text-[11px] text-blue-600 font-mono">Xtensa Dual-Core 240MHz</div>
            </div>

            <div className="bg-white border border-slate-300 rounded p-3 shadow-xs">
              <span className="text-slate-500 font-medium">WiFi Network State</span>
              <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                Connected (-58 dBm)
              </div>
              <div className="text-[11px] text-slate-500 font-mono">IP: 192.168.1.145</div>
            </div>

            <div className="bg-white border border-slate-300 rounded p-3 shadow-xs">
              <span className="text-slate-500 font-medium">RFID Sensor (SPI)</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">RC522 13.56 MHz</div>
              <div className="text-[11px] text-slate-500">ISO/IEC 14443A MIFARE</div>
            </div>

            <div className="bg-white border border-slate-300 rounded p-3 shadow-xs">
              <span className="text-slate-500 font-medium">Cold Storage Monitor</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">DHT11 (Temp & Humidity)</div>
              <div className="text-[11px] text-slate-500">Auto-fan relay trigger at 28°C</div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Box 1: RFID Scanner Simulation */}
            <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-600" />
                  1. Simulate RFID Card Tap (Stock Check-In / Out)
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">HTTP POST /api/esp32/scan</span>
              </div>

              {/* Tag Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select RFID Tag Tagged to Inventory Item:
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => { setSelectedTag(e.target.value); setCustomTag(''); }}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900"
                >
                  {registeredRfids.map(item => (
                    <option key={item.rfidTag} value={item.rfidTag}>
                      [{item.rfidTag}] {item.name} (Stock: {item.currentStock})
                    </option>
                  ))}
                  <option value="UNKNOWN-TAG-9999">[UNKNOWN-TAG-9999] Unregistered Tag (Test 404 Error)</option>
                </select>
              </div>

              {/* Or Custom Tag Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Or Type Custom Tag UID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. E280116060000204"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-mono uppercase"
                />
              </div>

              {/* Action & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gate Action:
                  </label>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setScanAction('IN')}
                      className={`py-1.5 rounded font-bold border ${
                        scanAction === 'IN'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      Stock IN
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanAction('OUT')}
                      className={`py-1.5 rounded font-bold border ${
                        scanAction === 'OUT'
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      Stock OUT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Units to Scan:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={scanQty}
                    onChange={(e) => setScanQty(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 focus:bg-white text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Tap Button */}
              <button
                type="button"
                onClick={handleTriggerRfidScan}
                disabled={scanning}
                className="w-full py-2.5 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Radio className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                <span>{scanning ? 'Transmitting HTTP Packet...' : '📡 Tap RFID Card on ESP32 Antenna'}</span>
              </button>
            </div>

            {/* Box 2: Climate Sensor Simulation (DHT11) */}
            <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-indigo-600" />
                  2. Simulate Warehouse Climate (DHT11 Sensor)
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">HTTP POST /api/esp32/telemetry</span>
              </div>

              {/* Temperature Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-red-500" />
                    Storage Temperature:
                  </span>
                  <span className={`font-mono font-bold ${temperature > 28 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                    {temperature}°C {temperature > 28 ? '(HIGH TEMP ALERT!)' : '(Normal)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="0.5"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>5°C (Chilled)</span>
                  <span className="text-amber-600 font-semibold">28°C Threshold</span>
                  <span>45°C (Extreme)</span>
                </div>
              </div>

              {/* Humidity Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    Relative Humidity:
                  </span>
                  <span className={`font-mono font-bold ${humidity > 70 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {humidity}% {humidity > 70 ? '(HUMIDITY WARNING)' : '(Good)'}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  step="1"
                  value={humidity}
                  onChange={(e) => setHumidity(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>20% (Dry)</span>
                  <span>70% Moisture Threshold</span>
                  <span>95% (Condensation)</span>
                </div>
              </div>

              {/* Send Telemetry Button */}
              <button
                type="button"
                onClick={handleSendTelemetry}
                disabled={sendingTelemetry}
                className="w-full py-2.5 px-4 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Thermometer className={`w-4 h-4 ${sendingTelemetry ? 'animate-spin' : ''}`} />
                <span>{sendingTelemetry ? 'Sending DHT11 Reading...' : 'Send Climate Telemetry to Backend'}</span>
              </button>
            </div>

          </div>

          {/* Live Serial Monitor Output (Mimicking Arduino Serial Monitor) */}
          <div className="bg-zinc-950 border border-slate-800 rounded-lg shadow-sm overflow-hidden text-xs">
            <div className="bg-zinc-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white font-mono text-[11px]">
                  ESP32 Serial Monitor (COM4 @ 115200 baud)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSerialLogs([
                  '[SYSTEM] Serial monitor cleared. Node online.',
                  '[SYSTEM] Listening on GPIO 5 (SS) and GPIO 4 (DHT)...'
                ])}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
              >
                Clear Terminal
              </button>
            </div>

            <div className="p-3 bg-black font-mono text-[11px] text-emerald-400 h-48 overflow-y-auto space-y-1">
              {serialLogs.map((log, idx) => (
                <div key={idx} className="leading-tight">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Subtab: Arduino C++ Code (.ino) */}
      {activeSubTab === 'code' && (
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                ESP32 Arduino C++ Sketch (`warehouse_esp32_scanner.ino`)
              </h2>
              <p className="text-[11px] text-slate-500">
                You can copy this into Arduino IDE and flash it directly to an ESP32 board!
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Arduino Sketch'}</span>
            </button>
          </div>

          <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto text-[11px] font-mono text-slate-200 leading-relaxed border border-slate-800 max-h-96">
            <pre>{arduinoCodeSnippet}</pre>
          </div>
        </div>
      )}

      {/* Subtab: Hardware Pinout & Circuit */}
      {activeSubTab === 'wiring' && (
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-4 text-xs">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              Hardware Schematic & Pin Wiring Guide (For Internal Exam Viva)
            </h2>
            <p className="text-slate-500 mt-0.5">
              Exact wiring table to explain to the teacher during physical circuit demonstration:
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-2 border border-slate-700">Hardware Module</th>
                  <th className="p-2 border border-slate-700">Module Pin</th>
                  <th className="p-2 border border-slate-700">ESP32 Pin</th>
                  <th className="p-2 border border-slate-700">Protocol / Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr>
                  <td className="p-2 font-bold" rowSpan={6}>RC522 RFID Reader</td>
                  <td className="p-2 font-mono">SDA (SS)</td>
                  <td className="p-2 font-mono font-bold text-blue-600">GPIO 5</td>
                  <td className="p-2">SPI Slave Select</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">SCK</td>
                  <td className="p-2 font-mono font-bold text-blue-600">GPIO 18</td>
                  <td className="p-2">SPI Serial Clock</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">MOSI</td>
                  <td className="p-2 font-mono font-bold text-blue-600">GPIO 23</td>
                  <td className="p-2">SPI Master Out Slave In</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">MISO</td>
                  <td className="p-2 font-mono font-bold text-blue-600">GPIO 19</td>
                  <td className="p-2">SPI Master In Slave Out</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">RST</td>
                  <td className="p-2 font-mono font-bold text-blue-600">GPIO 22</td>
                  <td className="p-2">Reset Line</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">3.3V & GND</td>
                  <td className="p-2 font-mono">3V3 & GND</td>
                  <td className="p-2">Power supply (Do NOT use 5V on RC522!)</td>
                </tr>

                <tr>
                  <td className="p-2 font-bold" rowSpan={2}>DHT11 Climate Sensor</td>
                  <td className="p-2 font-mono">DATA</td>
                  <td className="p-2 font-mono font-bold text-indigo-600">GPIO 4</td>
                  <td className="p-2">1-Wire Digital Communication</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">VCC & GND</td>
                  <td className="p-2 font-mono">3V3 & GND</td>
                  <td className="p-2">Regulated 3.3V power</td>
                </tr>

                <tr>
                  <td className="p-2 font-bold" rowSpan={3}>Indicators & Alerts</td>
                  <td className="p-2 font-mono">Active Buzzer (+)</td>
                  <td className="p-2 font-mono font-bold text-amber-600">GPIO 2</td>
                  <td className="p-2">Beep feedback on successful scan or low stock</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">Green LED (+)</td>
                  <td className="p-2 font-mono font-bold text-emerald-600">GPIO 15</td>
                  <td className="p-2">Stock Check-In Flash</td>
                </tr>
                <tr>
                  <td className="p-2 font-mono">Blue LED (+)</td>
                  <td className="p-2 font-mono font-bold text-blue-600">GPIO 13</td>
                  <td className="p-2">WiFi Connection Status indicator</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-xs">
            <strong>Exam Tip:</strong> If the professor asks <em>"Why do you use 3.3V instead of 5V for RC522?"</em>:
            Answer: <em>"The MFRC522 IC is rated for 2.5V - 3.6V operation. Supplying 5V can damage the RF front-end receiver or burn the SPI communication pins of the ESP32 which operates at 3.3V logic levels."</em>
          </div>
        </div>
      )}

    </div>
  );
}
