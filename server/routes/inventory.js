const r = require('express').Router();
const { protect } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const PurchaseOrder = require('../models/PurchaseOrder');

// GET /api/inventory/items
r.get('/items', protect, async (req, res) => {
  try {
    const q = req.query.category ? { category: req.query.category } : {};
    res.json(await Inventory.find(q).sort({ itemName: 1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/items', protect, async (req, res) => {
  try { res.status(201).json(await Inventory.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/items/:id', protect, async (req, res) => {
  try { res.json(await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

r.delete('/items/:id', protect, async (req, res) => {
  try { await Inventory.findByIdAndDelete(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// GET /api/inventory/alerts - expiring (<=90d) + low stock
r.get('/alerts', protect, async (req, res) => {
  try {
    const items = await Inventory.find();
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const expiring = [], lowStock = [];
    items.forEach(it => {
      if (it.expiryDate) {
        const daysLeft = Math.ceil((new Date(it.expiryDate + 'T00:00:00') - now) / 86400000);
        if (daysLeft <= 90) expiring.push({ ...it.toObject(), daysLeft });
      }
      if (Number(it.quantity) <= Number(it.reorderLevel)) lowStock.push(it);
    });
    expiring.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json({ expiring, lowStock });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /api/inventory/seed-sample
r.post('/seed-sample', protect, async (req, res) => {
  try {
    if (await Inventory.countDocuments() > 0) return res.json({ seeded: 0, message: 'Already has stock' });
    const d = (n) => { const t = new Date(Date.now() + n * 86400000); return t.toISOString().slice(0, 10); };
    const S = [
      { itemName: 'Paracetamol 500mg', category: 'medicine', batchNo: 'B2401', quantity: 500, unit: 'tablets', expiryDate: d(20), supplier: 'MediSupply Co', purchasePrice: 0.8, reorderLevel: 200, location: 'Pharmacy' },
      { itemName: 'Amoxicillin 250mg', category: 'medicine', batchNo: 'B2312', quantity: 80, unit: 'capsules', expiryDate: d(200), supplier: 'MediSupply Co', purchasePrice: 2.5, reorderLevel: 200, location: 'Pharmacy' },
      { itemName: 'Insulin Glargine', category: 'medicine', batchNo: 'IN2405', quantity: 40, unit: 'vials', expiryDate: d(45), supplier: 'BioPharma Ltd', purchasePrice: 450, reorderLevel: 30, location: 'Pharmacy Fridge' },
      { itemName: 'Surgical Gloves (M)', category: 'surgical', batchNo: 'SG2403', quantity: 150, unit: 'pairs', expiryDate: d(400), supplier: 'SafeMed Traders', purchasePrice: 12, reorderLevel: 300, location: 'OT Store' },
      { itemName: 'Syringe 5ml', category: 'consumable', batchNo: 'SY2402', quantity: 1000, unit: 'pcs', expiryDate: d(500), supplier: 'SafeMed Traders', purchasePrice: 3, reorderLevel: 500, location: 'Ward Store' },
      { itemName: 'IV Cannula 22G', category: 'consumable', batchNo: 'IV2311', quantity: 60, unit: 'pcs', expiryDate: d(10), supplier: 'SafeMed Traders', purchasePrice: 25, reorderLevel: 100, location: 'Ward Store' },
      { itemName: 'Betadine 10% 100ml', category: 'medicine', batchNo: 'BT2404', quantity: 90, unit: 'bottles', expiryDate: d(300), supplier: 'MediSupply Co', purchasePrice: 85, reorderLevel: 50, location: 'Pharmacy' },
      { itemName: 'Oxygen Mask', category: 'equipment', batchNo: 'OX2401', quantity: 25, unit: 'pcs', expiryDate: '', supplier: 'LifeLine Equip', purchasePrice: 120, reorderLevel: 20, location: 'Emergency' },
      { itemName: 'Cough Syrup 100ml', category: 'medicine', batchNo: 'CS2309', quantity: 30, unit: 'bottles', expiryDate: d(-5), supplier: 'MediSupply Co', purchasePrice: 65, reorderLevel: 40, location: 'Pharmacy' },
      { itemName: 'Bandage Roll 4inch', category: 'surgical', batchNo: 'BD2406', quantity: 200, unit: 'pcs', expiryDate: d(600), supplier: 'SafeMed Traders', purchasePrice: 18, reorderLevel: 100, location: 'Ward Store' }
    ];
    await Inventory.insertMany(S);
    res.json({ seeded: S.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ---------------- Purchase Orders ----------------
r.get('/purchase-orders', protect, async (req, res) => {
  try { res.json(await PurchaseOrder.find().sort({ orderDate: -1 }).limit(100)); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

r.post('/purchase-orders', protect, async (req, res) => {
  try {
    const n = await PurchaseOrder.countDocuments();
    const poNo = 'PO-' + new Date().getFullYear() + '-' + String(n + 1).padStart(4, '0');
    const items = req.body.items || [];
    const totalAmount = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
    res.status(201).json(await PurchaseOrder.create({ ...req.body, poNo, totalAmount }));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.patch('/purchase-orders/:id', protect, async (req, res) => {
  try { res.json(await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
});

// PATCH /api/inventory/purchase-orders/:id/receive - stock += PO items
r.patch('/purchase-orders/:id/receive', protect, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'Not found' });
    for (const it of po.items) {
      const inv = await Inventory.findOne({ itemName: it.itemName });
      if (inv) {
        inv.quantity = Number(inv.quantity) + Number(it.quantity);
        if (it.batchNo) inv.batchNo = it.batchNo;
        if (it.expiryDate) inv.expiryDate = it.expiryDate;
        await inv.save();
      } else {
        await Inventory.create({
          itemName: it.itemName, category: 'medicine', batchNo: it.batchNo || '',
          quantity: Number(it.quantity), unit: it.unit || 'pcs', expiryDate: it.expiryDate || '',
          supplier: po.supplier, purchasePrice: Number(it.rate) || 0, reorderLevel: 50, location: 'Store'
        });
      }
    }
    po.status = 'received'; po.receivedDate = new Date().toISOString().slice(0, 10);
    await po.save();
    res.json(po);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

module.exports = r;
