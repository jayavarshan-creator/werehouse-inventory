// Unit 4: Mongoose Schemas & Validation
// Model 5: StockMovement.js (Tracks In, Out, and Adjustments from Web UI or ESP32)
const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  movementNumber: {
    type: String,
    required: true,
    unique: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  referenceNumber: {
    type: String,
    default: 'MANUAL-REF'
  },
  reason: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    default: 'Storekeeper'
  },
  source: {
    type: String,
    enum: ['Manual', 'ESP32_Scanner', 'Transfer', 'PurchaseReceipt'],
    default: 'Manual'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);
