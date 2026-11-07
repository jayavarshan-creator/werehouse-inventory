// Unit 4: Mongoose Schemas & Validation
// Model 3: Item.js (Stock item with Reorder Level & ESP32 RFID integration)
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, 'SKU stock keeping unit is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Microcontrollers', 'Sensors', 'Actuators', 'RFID & Scanner', 'Packaging', 'Electronics', 'General']
  },
  unit: {
    type: String,
    default: 'pcs'
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  reorderLevel: {
    type: Number,
    required: true,
    default: 20,
    comment: 'Alert threshold when stock drops to or below this level'
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false
  },
  rfidTag: {
    type: String,
    index: true,
    trim: true,
    comment: 'Scanned by ESP32 RFID RC522 Reader'
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual property to check if low stock
itemSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.reorderLevel;
});

module.exports = mongoose.model('Item', itemSchema);
