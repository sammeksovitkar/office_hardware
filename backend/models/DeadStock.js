const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
});

const deadStockSchema = new mongoose.Schema({
  courtName: { type: String, required: true },
  companyName: { type: String, required: true },
  deadStockRegSrNo: { type: String, default: '' },
  deadStockBookPageNo: { type: String, default: '' },
  source: { type: String, default: '' },
  deliveryDate: { type: Date, default: null },
  installationDate: { type: Date, default: null },
  employeeAllocated: { type: String, default: '' },
  items: [itemSchema],
});

module.exports = mongoose.model('DeadStock', deadStockSchema);
