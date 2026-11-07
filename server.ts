import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'college-internal-project-secret-key-2026';

// Middleware for parsing JSON requests (Unit 3 - Node & Express)
app.use(express.json());

// In-Memory Database Store simulating MongoDB with Mongoose Schema validation
// Perfect for student submission, reproducible without needing external Atlas credentials
let users = [
  {
    _id: 'usr_1',
    name: 'Mohamed Thoufik (Admin)',
    email: 'admin@warehouse.local',
    passwordHash: bcrypt.hashSync('admin123', 8),
    role: 'Admin',
    department: 'Operations',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'usr_2',
    name: 'Sarah Jenkins',
    email: 'manager@warehouse.local',
    passwordHash: bcrypt.hashSync('manager123', 8),
    role: 'Warehouse Manager',
    department: 'Logistics',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'usr_3',
    name: 'Ravi Kumar',
    email: 'storekeeper@warehouse.local',
    passwordHash: bcrypt.hashSync('keeper123', 8),
    role: 'Storekeeper',
    department: 'Inventory Floor',
    createdAt: new Date().toISOString()
  }
];

let warehouses = [
  {
    _id: 'wh_1',
    code: 'WH-CENTRAL',
    name: 'Central Distribution Hub',
    location: 'Zone A, Industrial Estate',
    capacity: 10000,
    managerId: 'usr_2',
    status: 'Active',
    description: 'Primary storage facility for electronics and raw assemblies'
  },
  {
    _id: 'wh_2',
    code: 'WH-NORTH',
    name: 'North Regional Depot',
    location: 'Sector 4, Logistics Park',
    capacity: 5000,
    managerId: 'usr_2',
    status: 'Active',
    description: 'Regional fulfillment depot for local fast-moving parts'
  },
  {
    _id: 'wh_3',
    code: 'WH-COLD',
    name: 'Cold & Sensitive Storage',
    location: 'Unit 9, Climate Zone',
    capacity: 2500,
    managerId: 'usr_2',
    status: 'Active',
    description: 'Temperature-monitored facility for microchips & sensors'
  }
];

let suppliers = [
  {
    _id: 'sup_1',
    code: 'SUP-MICRO',
    name: 'Semicon Microtech Ltd',
    contactPerson: 'David Chen',
    email: 'sales@semiconmicro.com',
    phone: '+1 555-0192',
    address: '42 Silicon Avenue, Tech City',
    itemsSupplied: 'Microcontrollers, ICs, Sensors'
  },
  {
    _id: 'sup_2',
    code: 'SUP-ELECTRO',
    name: 'Apex Electro Components',
    contactPerson: 'Anita Roy',
    email: 'orders@apexelectro.in',
    phone: '+91 98765-43210',
    address: '15 Industrial Corridor, Bangalore',
    itemsSupplied: 'Capacitors, Resistors, Relays'
  },
  {
    _id: 'sup_3',
    code: 'SUP-PACK',
    name: 'EcoPack Logistics Supplies',
    contactPerson: 'Marcus Vance',
    email: 'support@ecopacklogistics.com',
    phone: '+1 555-4819',
    address: '88 Harbor Rd, Port Terminal',
    itemsSupplied: 'ESD Bags, Corrugated Boxes, RFID Labels'
  }
];

let items = [
  {
    _id: 'itm_1',
    sku: 'ESP32-WROOM-32D',
    name: 'ESP32 NodeMCU Development Board',
    category: 'Microcontrollers',
    unit: 'pcs',
    unitPrice: 5.50,
    currentStock: 120,
    reorderLevel: 30,
    warehouseId: 'wh_1',
    supplierId: 'sup_1',
    rfidTag: 'E280116060000204',
    description: 'Dual-core WiFi+Bluetooth SoC board for IoT telemetry'
  },
  {
    _id: 'itm_2',
    sku: 'SEN-DHT11-MOD',
    name: 'DHT11 Temp & Humidity Sensor',
    category: 'Sensors',
    unit: 'pcs',
    unitPrice: 1.80,
    currentStock: 18, // Below reorder level (alert!)
    reorderLevel: 25,
    warehouseId: 'wh_3',
    supplierId: 'sup_1',
    rfidTag: 'E280116060000205',
    description: 'Digital temperature & relative humidity sensor module'
  },
  {
    _id: 'itm_3',
    sku: 'RFID-RC522-KIT',
    name: 'RC522 13.56MHz RFID Reader Kit',
    category: 'RFID & Scanner',
    unit: 'kits',
    unitPrice: 3.20,
    currentStock: 45,
    reorderLevel: 20,
    warehouseId: 'wh_1',
    supplierId: 'sup_1',
    rfidTag: 'E280116060000206',
    description: 'SPI Interface RFID module with S50 white card & keychain'
  },
  {
    _id: 'itm_4',
    sku: 'RELAY-5V-4CH',
    name: '4-Channel 5V Relay Module',
    category: 'Actuators',
    unit: 'pcs',
    unitPrice: 4.10,
    currentStock: 12, // Critical low stock!
    reorderLevel: 30,
    warehouseId: 'wh_2',
    supplierId: 'sup_2',
    rfidTag: 'E280116060000207',
    description: 'Optocoupler isolated relay board for industrial loads'
  },
  {
    _id: 'itm_5',
    sku: 'BOX-ESD-M',
    name: 'Anti-Static ESD Storage Bin (Medium)',
    category: 'Packaging',
    unit: 'bins',
    unitPrice: 8.75,
    currentStock: 85,
    reorderLevel: 20,
    warehouseId: 'wh_1',
    supplierId: 'sup_3',
    rfidTag: 'E280116060000208',
    description: 'Conductive polypropylene bin for delicate electronics'
  }
];

let stockMovements = [
  {
    _id: 'mov_1',
    movementNumber: 'MOV-1001',
    itemId: 'itm_1',
    warehouseId: 'wh_1',
    type: 'IN',
    quantity: 50,
    referenceNumber: 'PO-2026-081',
    reason: 'Initial stock intake from Semicon Microtech',
    createdBy: 'Sarah Jenkins',
    source: 'Manual',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    _id: 'mov_2',
    movementNumber: 'MOV-1002',
    itemId: 'itm_2',
    warehouseId: 'wh_3',
    type: 'OUT',
    quantity: 15,
    referenceNumber: 'WO-8821',
    reason: 'Issued to Hardware Lab assembly line',
    createdBy: 'Ravi Kumar',
    source: 'ESP32_Scanner',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: 'mov_3',
    movementNumber: 'MOV-1003',
    itemId: 'itm_3',
    warehouseId: 'wh_1',
    type: 'IN',
    quantity: 25,
    referenceNumber: 'REC-901',
    reason: 'Restock via IoT automated gate scanner',
    createdBy: 'ESP32 Gate #1',
    source: 'ESP32_Scanner',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

let transfers = [
  {
    _id: 'trf_1',
    transferNumber: 'TRF-5001',
    fromWarehouseId: 'wh_1',
    toWarehouseId: 'wh_2',
    itemId: 'itm_1',
    quantity: 20,
    status: 'COMPLETED',
    requestedBy: 'Ravi Kumar',
    approvedBy: 'Sarah Jenkins',
    notes: 'Urgent transfer for North depot customer order',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: 'trf_2',
    transferNumber: 'TRF-5002',
    fromWarehouseId: 'wh_1',
    toWarehouseId: 'wh_3',
    itemId: 'itm_4',
    quantity: 10,
    status: 'PENDING',
    requestedBy: 'Ravi Kumar',
    approvedBy: null,
    notes: 'Replenish relay modules in Climate Zone',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

let purchaseReceipts = [
  {
    _id: 'pr_1',
    receiptNumber: 'PR-9001',
    supplierId: 'sup_1',
    warehouseId: 'wh_1',
    items: [
      { itemId: 'itm_1', quantity: 50, unitCost: 5.50, totalCost: 275.00 },
      { itemId: 'itm_3', quantity: 20, unitCost: 3.20, totalCost: 64.00 }
    ],
    totalAmount: 339.00,
    receivedBy: 'Ravi Kumar',
    status: 'RECEIVED',
    date: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// ESP32 telemetry & scanner log store
let esp32Logs: Array<{
  id: string;
  timestamp: string;
  type: 'RFID_SCAN' | 'ENVIRONMENTAL';
  deviceId: string;
  warehouseCode: string;
  data: any;
  status: 'SUCCESS' | 'WARNING' | 'ALERT';
}> = [
  {
    id: 'esp_log_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    type: 'ENVIRONMENTAL',
    deviceId: 'ESP32-NODE-01',
    warehouseCode: 'WH-COLD',
    data: { temperature: 22.4, humidity: 48.2, status: 'Optimal Storage Condition' },
    status: 'SUCCESS'
  },
  {
    id: 'esp_log_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    type: 'RFID_SCAN',
    deviceId: 'ESP32-GATE-RFID-01',
    warehouseCode: 'WH-CENTRAL',
    data: { rfidTag: 'E280116060000204', itemSku: 'ESP32-WROOM-32D', action: 'IN', quantity: 10 },
    status: 'SUCCESS'
  }
];

let esp32DeviceStatus = {
  deviceId: 'ESP32-INVENTORY-GATEWAY-V2',
  ipAddress: '192.168.1.145',
  macAddress: '24:6F:28:B4:9C:12',
  wifiSSID: 'Warehouse_IoT_Mesh',
  rssi: -58,
  uptimeSeconds: 84920,
  firmwareVersion: 'v2.1-college-release',
  activeModules: ['RC522 RFID SPI', 'DHT11 Climate Sensor', 'HTTP REST Client', 'Buzzer & OLED Display'],
  lastSeen: new Date().toISOString()
};

// ----------------- AUTHENTICATION MIDDLEWARE (Unit 3) -----------------
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err: any) {
    res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
}

// Role authorization middleware
function authorizeRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}]. Your role is: ${user?.role || 'Guest'}`
      });
      return;
    }
    next();
  };
}

// ----------------- AUTH ROUTES -----------------
app.post('/api/auth/register', (req: Request, res: Response): void => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      res.status(409).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const newUser = {
      _id: 'usr_' + Date.now(),
      name,
      email: email.toLowerCase(),
      passwordHash: bcrypt.hashSync(password, 8),
      role: role || 'Storekeeper',
      department: department || 'General',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);

    const token = jwt.sign(
      { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, department: newUser.department }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Registration error: ' + err.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      return;
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Login error: ' + err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req: Request, res: Response): void => {
  const tokenUser = (req as any).user;
  const user = users.find(u => u._id === tokenUser.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }
  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department }
  });
});

// ----------------- DASHBOARD OVERVIEW -----------------
app.get('/api/dashboard/stats', (req: Request, res: Response): void => {
  const totalStockItems = items.reduce((sum, item) => sum + item.currentStock, 0);
  const totalValuation = items.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
  const lowStockItems = items.filter(item => item.currentStock <= item.reorderLevel);
  const activeWarehouses = warehouses.filter(w => w.status === 'Active').length;
  const pendingTransfers = transfers.filter(t => t.status === 'PENDING').length;

  res.json({
    success: true,
    data: {
      totalItemsCount: items.length,
      totalUnitsInStock: totalStockItems,
      totalInventoryValueUSD: parseFloat(totalValuation.toFixed(2)),
      lowStockAlertsCount: lowStockItems.length,
      lowStockItems,
      activeWarehousesCount: activeWarehouses,
      pendingTransfersCount: pendingTransfers,
      totalSuppliersCount: suppliers.length,
      recentMovements: stockMovements.slice(-5).reverse(),
      esp32Uptime: esp32DeviceStatus.uptimeSeconds,
      esp32Connected: true
    }
  });
});

// ----------------- WAREHOUSE ROUTES -----------------
app.get('/api/warehouses', (req: Request, res: Response): void => {
  // calculate current occupancy for each warehouse
  const data = warehouses.map(wh => {
    const whItems = items.filter(i => i.warehouseId === wh._id);
    const totalStoredUnits = whItems.reduce((acc, i) => acc + i.currentStock, 0);
    const occupancyPercentage = wh.capacity > 0 ? Math.min(100, Math.round((totalStoredUnits / wh.capacity) * 100)) : 0;
    const manager = users.find(u => u._id === wh.managerId);
    return {
      ...wh,
      totalStoredUnits,
      occupancyPercentage,
      managerName: manager ? manager.name : 'Unassigned'
    };
  });
  res.json({ success: true, data });
});

app.post('/api/warehouses', authMiddleware, authorizeRole(['Admin', 'Warehouse Manager']), (req: Request, res: Response): void => {
  const { code, name, location, capacity, managerId, description } = req.body;
  if (!code || !name || !location) {
    res.status(400).json({ success: false, message: 'Code, Name, and Location are required.' });
    return;
  }

  const newWarehouse = {
    _id: 'wh_' + Date.now(),
    code: code.trim().toUpperCase(),
    name: name.trim(),
    location: location.trim(),
    capacity: Number(capacity) || 1000,
    managerId: managerId || 'usr_2',
    status: 'Active',
    description: description || ''
  };

  warehouses.push(newWarehouse);
  res.status(201).json({ success: true, message: 'Warehouse created successfully', data: newWarehouse });
});

app.delete('/api/warehouses/:id', authMiddleware, authorizeRole(['Admin']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const initialLength = warehouses.length;
  warehouses = warehouses.filter(w => w._id !== id);
  if (warehouses.length === initialLength) {
    res.status(404).json({ success: false, message: 'Warehouse not found.' });
    return;
  }
  res.json({ success: true, message: 'Warehouse deleted successfully.' });
});

// ----------------- ITEMS (INVENTORY) ROUTES -----------------
app.get('/api/items', (req: Request, res: Response): void => {
  const { search, warehouseId, category, lowStockOnly, sortBy } = req.query;
  let result = [...items];

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(i => 
      i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      (i.rfidTag && i.rfidTag.toLowerCase().includes(q))
    );
  }

  if (warehouseId && warehouseId !== 'ALL') {
    result = result.filter(i => i.warehouseId === warehouseId);
  }

  if (category && category !== 'ALL') {
    result = result.filter(i => i.category === category);
  }

  if (lowStockOnly === 'true') {
    result = result.filter(i => i.currentStock <= i.reorderLevel);
  }

  if (sortBy === 'stock_asc') {
    result.sort((a, b) => a.currentStock - b.currentStock);
  } else if (sortBy === 'stock_desc') {
    result.sort((a, b) => b.currentStock - a.currentStock);
  } else if (sortBy === 'price_desc') {
    result.sort((a, b) => b.unitPrice - a.unitPrice);
  } else {
    // Default alphabetical by name
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Populate warehouse and supplier names
  const enriched = result.map(i => {
    const wh = warehouses.find(w => w._id === i.warehouseId);
    const sup = suppliers.find(s => s._id === i.supplierId);
    return {
      ...i,
      warehouseName: wh ? wh.name : 'Unknown Warehouse',
      warehouseCode: wh ? wh.code : 'N/A',
      supplierName: sup ? sup.name : 'Unknown Supplier',
      isLowStock: i.currentStock <= i.reorderLevel
    };
  });

  res.json({ success: true, data: enriched });
});

app.post('/api/items', authMiddleware, (req: Request, res: Response): void => {
  const { sku, name, category, unit, unitPrice, currentStock, reorderLevel, warehouseId, supplierId, rfidTag, description } = req.body;
  if (!sku || !name || !warehouseId) {
    res.status(400).json({ success: false, message: 'SKU, Name, and Warehouse are required fields.' });
    return;
  }

  const existing = items.find(i => i.sku.toUpperCase() === sku.toUpperCase());
  if (existing) {
    res.status(409).json({ success: false, message: `Item with SKU ${sku} already exists.` });
    return;
  }

  const newItem = {
    _id: 'itm_' + Date.now(),
    sku: sku.trim().toUpperCase(),
    name: name.trim(),
    category: category || 'General',
    unit: unit || 'pcs',
    unitPrice: Number(unitPrice) || 0,
    currentStock: Number(currentStock) || 0,
    reorderLevel: Number(reorderLevel) || 10,
    warehouseId,
    supplierId: supplierId || suppliers[0]._id,
    rfidTag: rfidTag ? rfidTag.trim().toUpperCase() : 'TAG-' + Math.floor(100000 + Math.random() * 900000),
    description: description || ''
  };

  items.push(newItem);

  // Auto record initial movement if stock > 0
  if (newItem.currentStock > 0) {
    stockMovements.push({
      _id: 'mov_' + Date.now(),
      movementNumber: 'MOV-' + (1000 + stockMovements.length + 1),
      itemId: newItem._id,
      warehouseId: newItem.warehouseId,
      type: 'IN',
      quantity: newItem.currentStock,
      referenceNumber: 'INIT-STOCK',
      reason: 'Initial stock intake upon item creation',
      createdBy: (req as any).user?.name || 'Admin',
      source: 'Manual',
      timestamp: new Date().toISOString()
    });
  }

  res.status(201).json({ success: true, message: 'Item created successfully', data: newItem });
});

app.put('/api/items/:id', authMiddleware, (req: Request, res: Response): void => {
  const { id } = req.params;
  const itemIndex = items.findIndex(i => i._id === id);
  if (itemIndex === -1) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }

  const prevStock = items[itemIndex].currentStock;
  const { name, category, unit, unitPrice, currentStock, reorderLevel, warehouseId, supplierId, rfidTag, description } = req.body;

  items[itemIndex] = {
    ...items[itemIndex],
    name: name ?? items[itemIndex].name,
    category: category ?? items[itemIndex].category,
    unit: unit ?? items[itemIndex].unit,
    unitPrice: unitPrice !== undefined ? Number(unitPrice) : items[itemIndex].unitPrice,
    currentStock: currentStock !== undefined ? Number(currentStock) : items[itemIndex].currentStock,
    reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : items[itemIndex].reorderLevel,
    warehouseId: warehouseId ?? items[itemIndex].warehouseId,
    supplierId: supplierId ?? items[itemIndex].supplierId,
    rfidTag: rfidTag ?? items[itemIndex].rfidTag,
    description: description ?? items[itemIndex].description
  };

  // If stock was adjusted directly in edit, create adjustment audit record
  if (currentStock !== undefined && Number(currentStock) !== prevStock) {
    const diff = Number(currentStock) - prevStock;
    stockMovements.push({
      _id: 'mov_' + Date.now(),
      movementNumber: 'MOV-' + (1000 + stockMovements.length + 1),
      itemId: id,
      warehouseId: items[itemIndex].warehouseId,
      type: 'ADJUSTMENT',
      quantity: Math.abs(diff),
      referenceNumber: 'MANUAL-ADJ',
      reason: diff > 0 ? `Manual stock adjustment (+${diff})` : `Manual stock adjustment (${diff})`,
      createdBy: (req as any).user?.name || 'Manager',
      source: 'Manual',
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, message: 'Item updated successfully', data: items[itemIndex] });
});

app.delete('/api/items/:id', authMiddleware, authorizeRole(['Admin', 'Warehouse Manager']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const initialLength = items.length;
  items = items.filter(i => i._id !== id);
  if (items.length === initialLength) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }
  res.json({ success: true, message: 'Item deleted successfully.' });
});

// ----------------- SUPPLIERS ROUTES -----------------
app.get('/api/suppliers', (req: Request, res: Response): void => {
  res.json({ success: true, data: suppliers });
});

app.post('/api/suppliers', authMiddleware, (req: Request, res: Response): void => {
  const { code, name, contactPerson, email, phone, address, itemsSupplied } = req.body;
  if (!name || !email) {
    res.status(400).json({ success: false, message: 'Supplier name and email are required.' });
    return;
  }

  const newSupplier = {
    _id: 'sup_' + Date.now(),
    code: code || 'SUP-' + (suppliers.length + 1),
    name: name.trim(),
    contactPerson: contactPerson || '',
    email: email.trim(),
    phone: phone || '',
    address: address || '',
    itemsSupplied: itemsSupplied || ''
  };

  suppliers.push(newSupplier);
  res.status(201).json({ success: true, message: 'Supplier added successfully', data: newSupplier });
});

app.delete('/api/suppliers/:id', authMiddleware, authorizeRole(['Admin']), (req: Request, res: Response): void => {
  const { id } = req.params;
  suppliers = suppliers.filter(s => s._id !== id);
  res.json({ success: true, message: 'Supplier removed.' });
});

// ----------------- STOCK MOVEMENTS (IN, OUT, AUDIT) -----------------
app.get('/api/stock-movements', (req: Request, res: Response): void => {
  const enriched = stockMovements.map(m => {
    const item = items.find(i => i._id === m.itemId);
    const wh = warehouses.find(w => w._id === m.warehouseId);
    return {
      ...m,
      itemName: item ? item.name : 'Unknown Item',
      itemSku: item ? item.sku : 'N/A',
      warehouseName: wh ? wh.name : 'Unknown Warehouse',
      warehouseCode: wh ? wh.code : 'N/A'
    };
  }).reverse(); // Most recent first

  res.json({ success: true, data: enriched });
});

app.post('/api/stock-movements', authMiddleware, (req: Request, res: Response): void => {
  const { itemId, warehouseId, type, quantity, referenceNumber, reason } = req.body;
  const qty = Number(quantity);

  if (!itemId || !type || !qty || qty <= 0) {
    res.status(400).json({ success: false, message: 'Valid item, movement type (IN/OUT/ADJUSTMENT), and positive quantity required.' });
    return;
  }

  const itemIndex = items.findIndex(i => i._id === itemId);
  if (itemIndex === -1) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }

  const item = items[itemIndex];
  const targetWhId = warehouseId || item.warehouseId;

  // Validation: cannot issue more than existing stock
  if (type === 'OUT' && item.currentStock < qty) {
    res.status(400).json({
      success: false,
      message: `Insufficient stock! Current stock is ${item.currentStock} ${item.unit}, but attempted to issue ${qty} ${item.unit}.`
    });
    return;
  }

  // Update item stock
  if (type === 'IN') {
    item.currentStock += qty;
  } else if (type === 'OUT') {
    item.currentStock -= qty;
  } else if (type === 'ADJUSTMENT') {
    item.currentStock = qty; // direct adjustment sets to new count
  }

  const movementRecord = {
    _id: 'mov_' + Date.now(),
    movementNumber: 'MOV-' + (1000 + stockMovements.length + 1),
    itemId: item._id,
    warehouseId: targetWhId,
    type,
    quantity: qty,
    referenceNumber: referenceNumber || 'MANUAL-REF',
    reason: reason || `Manual Stock ${type} processed by ${(req as any).user?.name || 'Operator'}`,
    createdBy: (req as any).user?.name || 'Operator',
    source: 'Manual' as const,
    timestamp: new Date().toISOString()
  };

  stockMovements.push(movementRecord);

  res.status(201).json({
    success: true,
    message: `Stock ${type} successful! New stock level: ${item.currentStock} ${item.unit}`,
    data: movementRecord,
    updatedStock: item.currentStock,
    isLowStock: item.currentStock <= item.reorderLevel
  });
});

// ----------------- TRANSFERS (Inter-warehouse transfer workflow) -----------------
app.get('/api/transfers', (req: Request, res: Response): void => {
  const enriched = transfers.map(t => {
    const item = items.find(i => i._id === t.itemId);
    const fromWh = warehouses.find(w => w._id === t.fromWarehouseId);
    const toWh = warehouses.find(w => w._id === t.toWarehouseId);
    return {
      ...t,
      itemName: item ? item.name : 'Unknown Item',
      itemSku: item ? item.sku : 'N/A',
      fromWarehouseName: fromWh ? fromWh.name : 'N/A',
      toWarehouseName: toWh ? toWh.name : 'N/A'
    };
  }).reverse();

  res.json({ success: true, data: enriched });
});

app.post('/api/transfers', authMiddleware, (req: Request, res: Response): void => {
  const { fromWarehouseId, toWarehouseId, itemId, quantity, notes } = req.body;
  const qty = Number(quantity);

  if (!fromWarehouseId || !toWarehouseId || !itemId || !qty || qty <= 0) {
    res.status(400).json({ success: false, message: 'Origin, Destination, Item, and positive quantity required.' });
    return;
  }

  if (fromWarehouseId === toWarehouseId) {
    res.status(400).json({ success: false, message: 'Source and destination warehouses cannot be the same.' });
    return;
  }

  const item = items.find(i => i._id === itemId);
  if (!item) {
    res.status(404).json({ success: false, message: 'Item not found.' });
    return;
  }

  if (item.currentStock < qty) {
    res.status(400).json({ success: false, message: `Insufficient stock in source warehouse. Available: ${item.currentStock}` });
    return;
  }

  const newTransfer = {
    _id: 'trf_' + Date.now(),
    transferNumber: 'TRF-' + (5000 + transfers.length + 1),
    fromWarehouseId,
    toWarehouseId,
    itemId,
    quantity: qty,
    status: 'PENDING',
    requestedBy: (req as any).user?.name || 'Storekeeper',
    approvedBy: null,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  transfers.push(newTransfer);
  res.status(201).json({ success: true, message: 'Transfer request created successfully.', data: newTransfer });
});

app.put('/api/transfers/:id/status', authMiddleware, authorizeRole(['Admin', 'Warehouse Manager']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body; // 'APPROVED', 'COMPLETED', 'CANCELLED'

  const trfIndex = transfers.findIndex(t => t._id === id);
  if (trfIndex === -1) {
    res.status(404).json({ success: false, message: 'Transfer not found.' });
    return;
  }

  const trf = transfers[trfIndex];
  if (trf.status === 'COMPLETED' || trf.status === 'CANCELLED') {
    res.status(400).json({ success: false, message: `Transfer is already finalized (${trf.status}).` });
    return;
  }

  if (status === 'COMPLETED') {
    const item = items.find(i => i._id === trf.itemId);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item no longer exists.' });
      return;
    }
    // Update item warehouse destination
    item.warehouseId = trf.toWarehouseId;
    trf.status = 'COMPLETED';
    trf.approvedBy = (req as any).user?.name || 'Manager';

    // Log movement records
    stockMovements.push({
      _id: 'mov_' + Date.now(),
      movementNumber: 'MOV-' + (1000 + stockMovements.length + 1),
      itemId: item._id,
      warehouseId: trf.toWarehouseId,
      type: 'IN',
      quantity: trf.quantity,
      referenceNumber: trf.transferNumber,
      reason: `Inter-warehouse transfer received from ${trf.fromWarehouseId}`,
      createdBy: (req as any).user?.name || 'Manager',
      source: 'Manual',
      timestamp: new Date().toISOString()
    });
  } else if (status === 'CANCELLED') {
    trf.status = 'CANCELLED';
    trf.approvedBy = (req as any).user?.name || 'Manager';
  } else if (status === 'APPROVED') {
    trf.status = 'APPROVED';
    trf.approvedBy = (req as any).user?.name || 'Manager';
  }

  res.json({ success: true, message: `Transfer status changed to ${status}.`, data: trf });
});

// ----------------- PURCHASE RECEIPTS (PO Intake) -----------------
app.get('/api/purchase-receipts', (req: Request, res: Response): void => {
  const enriched = purchaseReceipts.map(pr => {
    const sup = suppliers.find(s => s._id === pr.supplierId);
    const wh = warehouses.find(w => w._id === pr.warehouseId);
    const enrichedItems = pr.items.map(itemLine => {
      const itm = items.find(i => i._id === itemLine.itemId);
      return {
        ...itemLine,
        itemName: itm ? itm.name : 'Unknown Item',
        itemSku: itm ? itm.sku : 'N/A'
      };
    });
    return {
      ...pr,
      supplierName: sup ? sup.name : 'Unknown Supplier',
      warehouseName: wh ? wh.name : 'Unknown Warehouse',
      items: enrichedItems
    };
  }).reverse();

  res.json({ success: true, data: enriched });
});

app.post('/api/purchase-receipts', authMiddleware, (req: Request, res: Response): void => {
  const { supplierId, warehouseId, receiptItems } = req.body;
  if (!supplierId || !warehouseId || !Array.isArray(receiptItems) || receiptItems.length === 0) {
    res.status(400).json({ success: false, message: 'Supplier, Warehouse, and at least one item line are required.' });
    return;
  }

  let totalAmount = 0;
  const processedItems = receiptItems.map((line: any) => {
    const qty = Number(line.quantity) || 1;
    const cost = Number(line.unitCost) || 0;
    const lineTotal = qty * cost;
    totalAmount += lineTotal;

    // Auto-increase item inventory in database
    const item = items.find(i => i._id === line.itemId);
    if (item) {
      item.currentStock += qty;
    }

    return {
      itemId: line.itemId,
      quantity: qty,
      unitCost: cost,
      totalCost: lineTotal
    };
  });

  const receiptNumber = 'PR-' + (9000 + purchaseReceipts.length + 1);
  const newReceipt = {
    _id: 'pr_' + Date.now(),
    receiptNumber,
    supplierId,
    warehouseId,
    items: processedItems,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    receivedBy: (req as any).user?.name || 'Storekeeper',
    status: 'RECEIVED',
    date: new Date().toISOString()
  };

  purchaseReceipts.push(newReceipt);

  // Log movement for each item
  processedItems.forEach(line => {
    stockMovements.push({
      _id: 'mov_' + Date.now() + Math.random(),
      movementNumber: 'MOV-' + (1000 + stockMovements.length + 1),
      itemId: line.itemId,
      warehouseId,
      type: 'IN',
      quantity: line.quantity,
      referenceNumber: receiptNumber,
      reason: `Purchased goods received under ${receiptNumber}`,
      createdBy: (req as any).user?.name || 'Storekeeper',
      source: 'Manual',
      timestamp: new Date().toISOString()
    });
  });

  res.status(201).json({ success: true, message: 'Purchase receipt generated & stock updated.', data: newReceipt });
});

// ----------------- ESP32 IoT SCANNER & SENSOR ENDPOINTS -----------------
// Real endpoint called by ESP32 microcontroller via HTTP POST
app.post('/api/esp32/scan', (req: Request, res: Response): void => {
  try {
    const { rfidTag, scannerId, warehouseCode, action, quantity } = req.body;
    const qty = Number(quantity) || 1;
    const act = (action || 'IN').toUpperCase();

    if (!rfidTag) {
      res.status(400).json({ success: false, message: 'RFID Tag UID is required from ESP32.' });
      return;
    }

    // Lookup item by RFID Tag (or SKU if tag is SKU)
    const itemIndex = items.findIndex(i => 
      (i.rfidTag && i.rfidTag.toLowerCase() === rfidTag.toLowerCase()) ||
      i.sku.toLowerCase() === rfidTag.toLowerCase()
    );

    if (itemIndex === -1) {
      const unknownLog = {
        id: 'esp_log_' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'RFID_SCAN' as const,
        deviceId: scannerId || 'ESP32-GATE-NODE',
        warehouseCode: warehouseCode || 'WH-CENTRAL',
        data: { rfidTag, error: 'Unregistered RFID Tag / Unknown SKU', action: act },
        status: 'WARNING' as const
      };
      esp32Logs.unshift(unknownLog);

      res.status(404).json({
        success: false,
        message: `Unknown RFID Tag [${rfidTag}]. No item found in warehouse database.`,
        buzzerPattern: 'ERROR_DOUBLE_BEEP'
      });
      return;
    }

    const item = items[itemIndex];
    if (act === 'OUT' && item.currentStock < qty) {
      res.status(400).json({
        success: false,
        message: `Stock Out Failed: Available stock is only ${item.currentStock} ${item.unit}.`,
        buzzerPattern: 'ERROR_DOUBLE_BEEP'
      });
      return;
    }

    if (act === 'IN') {
      item.currentStock += qty;
    } else {
      item.currentStock -= qty;
    }

    const wh = warehouses.find(w => w._id === item.warehouseId);

    // Create stock movement record
    const movement = {
      _id: 'mov_' + Date.now(),
      movementNumber: 'MOV-' + (1000 + stockMovements.length + 1),
      itemId: item._id,
      warehouseId: item.warehouseId,
      type: (act === 'OUT' ? 'OUT' : 'IN') as 'IN' | 'OUT',
      quantity: qty,
      referenceNumber: `ESP32-SCAN-${rfidTag.slice(-4)}`,
      reason: `Automated RFID check-${act.toLowerCase()} via ${scannerId || 'ESP32 Gate'}`,
      createdBy: scannerId || 'ESP32 IoT Node',
      source: 'ESP32_Scanner' as const,
      timestamp: new Date().toISOString()
    };
    stockMovements.push(movement);

    const logEntry = {
      id: 'esp_log_' + Date.now(),
      timestamp: new Date().toISOString(),
      type: 'RFID_SCAN' as const,
      deviceId: scannerId || 'ESP32-GATE-NODE',
      warehouseCode: wh ? wh.code : (warehouseCode || 'WH-CENTRAL'),
      data: {
        rfidTag,
        itemSku: item.sku,
        itemName: item.name,
        action: act,
        quantity: qty,
        newStock: item.currentStock
      },
      status: 'SUCCESS' as const
    };
    esp32Logs.unshift(logEntry);
    if (esp32Logs.length > 50) esp32Logs.pop();

    esp32DeviceStatus.lastSeen = new Date().toISOString();

    res.json({
      success: true,
      message: `ESP32 Scan Success: ${act} ${qty} ${item.unit} of ${item.name}`,
      item: {
        sku: item.sku,
        name: item.name,
        currentStock: item.currentStock,
        unit: item.unit,
        isLowStock: item.currentStock <= item.reorderLevel
      },
      buzzerPattern: item.currentStock <= item.reorderLevel ? 'WARNING_LOW_STOCK_ALERT' : 'SUCCESS_SHORT_BEEP'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'ESP32 Scan Error: ' + err.message });
  }
});

// ESP32 Environmental DHT11 telemetry
app.post('/api/esp32/telemetry', (req: Request, res: Response): void => {
  const { deviceId, warehouseCode, temperature, humidity, batteryVoltage } = req.body;
  const temp = Number(temperature) || 24;
  const hum = Number(humidity) || 50;

  const isTempAlert = temp > 28 || temp < 10;
  const isHumAlert = hum > 70;

  const status: 'ALERT' | 'SUCCESS' = (isTempAlert || isHumAlert) ? 'ALERT' : 'SUCCESS';

  const entry = {
    id: 'esp_log_' + Date.now(),
    timestamp: new Date().toISOString(),
    type: 'ENVIRONMENTAL' as const,
    deviceId: deviceId || 'ESP32-DHT11-NODE',
    warehouseCode: warehouseCode || 'WH-COLD',
    data: {
      temperature: temp,
      humidity: hum,
      batteryVoltage: batteryVoltage || 3.7,
      condition: isTempAlert ? 'HIGH TEMP WARNING' : isHumAlert ? 'HUMIDITY ALERT' : 'Normal Conditions'
    },
    status
  };

  esp32Logs.unshift(entry);
  if (esp32Logs.length > 50) esp32Logs.pop();

  esp32DeviceStatus.lastSeen = new Date().toISOString();

  res.json({
    success: true,
    message: 'Telemetry received',
    systemStatus: status,
    fanRelay: isTempAlert ? 'ON' : 'OFF' // Relay command to ESP32 to trigger cooling fan
  });
});

app.get('/api/esp32/status', (req: Request, res: Response): void => {
  res.json({
    success: true,
    device: esp32DeviceStatus,
    recentLogs: esp32Logs.slice(0, 20),
    registeredRfids: items.map(i => ({
      rfidTag: i.rfidTag,
      sku: i.sku,
      name: i.name,
      currentStock: i.currentStock,
      reorderLevel: i.reorderLevel
    }))
  });
});

// Reset demo data endpoint
app.post('/api/system/reset-demo', (req: Request, res: Response): void => {
  items[0].currentStock = 120;
  items[1].currentStock = 18;
  items[2].currentStock = 45;
  items[3].currentStock = 12;
  items[4].currentStock = 85;
  res.json({ success: true, message: 'Demo dataset restored to initial state.' });
});

// ----------------- VITE FRONTEND MIDDLEWARE / STATIC FILES -----------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MERN Warehouse System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
