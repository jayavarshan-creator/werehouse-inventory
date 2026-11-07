// Unit 4: Mongoose Schemas & Validation
// Model 4: Supplier.js
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Supplier contact email is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String
  },
  itemsSupplied: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
