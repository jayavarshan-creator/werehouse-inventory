// Unit 4: Mongoose Schemas & Validation
// Model 2: Warehouse.js
const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Warehouse code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Warehouse physical location is required']
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1 unit']
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Inactive'],
    default: 'Active'
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
