// Unit 4: Mongoose Schemas & Validation
// Model 6: Transfer.js (Inter-Warehouse Stock Transfer)
const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true
  },
  fromWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  toWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Transfer quantity must be at least 1']
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  requestedBy: {
    type: String,
    required: true
  },
  approvedBy: {
    type: String,
    default: null
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transfer', transferSchema);
