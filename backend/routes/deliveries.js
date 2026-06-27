const express = require('express');
const Delivery = require('../models/Delivery');
const auth = require('../middleware/auth');
const { auditLogger } = require('../middleware/audit');
const { generateDeliveryCode } = require('../utils/helpers');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const deliveries = await Delivery.find(filter)
      .populate('invoice', 'invoiceCode grandTotal')
      .populate('customer', 'name telephone address')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ data: deliveries });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch deliveries.', error: error.message });
  }
});

router.post('/', auditLogger('delivery_created'), async (req, res) => {
  try {
    const delivery = await Delivery.create({
      ...req.body,
      deliveryCode: await generateDeliveryCode(Delivery),
      createdBy: req.user._id,
    });
    res.status(201).json({ message: 'Delivery created.', data: delivery });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create delivery.', error: error.message });
  }
});

router.put('/:id', auditLogger('delivery_updated'), async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });
    res.json({ message: 'Delivery updated.', data: delivery });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update delivery.', error: error.message });
  }
});

module.exports = router;
