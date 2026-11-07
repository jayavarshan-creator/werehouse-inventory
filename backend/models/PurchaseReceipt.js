// Unit 4: Mongoose Schemas & Validation
// Model 7: PurchaseReceipt.js (Supplier Goods Inward Note)
const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true
  }
});

const purchaseReceiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  items: [purchaseItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  receivedBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['RECEIVED', 'INSPECTING', 'CANCELLED'],
    default: 'RECEIVED'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PurchaseReceipt', purchaseReceiptSchema);
