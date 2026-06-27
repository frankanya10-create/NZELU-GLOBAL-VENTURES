const express = require('express');
const Branch = require('../models/Branch');
const auth = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { auditLogger } = require('../middleware/audit');

const router = express.Router();

router.use(auth);
router.use(rbac('administrator'));

router.get('/', async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).populate('manager', 'name email');
    res.json({ data: branches });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch branches.', error: error.message });
  }
});

router.post('/', auditLogger('branch_created'), async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ message: 'Branch created.', data: branch });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create branch.', error: error.message });
  }
});

router.put('/:id', auditLogger('branch_updated'), async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) return res.status(404).json({ message: 'Branch not found.' });
    res.json({ message: 'Branch updated.', data: branch });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update branch.', error: error.message });
  }
});

module.exports = router;
