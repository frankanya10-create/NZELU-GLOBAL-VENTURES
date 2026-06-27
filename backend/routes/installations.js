const express = require('express');
const Installation = require('../models/Installation');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/audit');
const { generateInstallationCode } = require('../utils/helpers');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customer = req.query.customer;

    const installations = await Installation.find(filter)
      .populate('customer', 'name telephone')
      .populate('assignedBy', 'name')
      .populate('timeline.completedBy', 'name')
      .sort({ scheduledDate: -1 });

    res.json({ data: installations });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch installations.', error: error.message });
  }
});

router.post('/', auditLogger('installation_created'), async (req, res) => {
  try {
    const installation = await Installation.create({
      ...req.body,
      jobCode: await generateInstallationCode(Installation),
      assignedBy: req.user._id,
    });
    res.status(201).json({ message: 'Installation job created.', data: installation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create installation.', error: error.message });
  }
});

router.put('/:id', auditLogger('installation_updated'), async (req, res) => {
  try {
    const installation = await Installation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!installation) return res.status(404).json({ message: 'Installation not found.' });
    res.json({ message: 'Installation updated.', data: installation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update installation.', error: error.message });
  }
});

module.exports = router;
