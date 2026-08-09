const generateInvoiceCode = async (Invoice, type) => {
  const year = new Date().getFullYear();
  const prefix = type === 'proforma' ? 'NGV-PRO' : 'NGV-CSH';
  // Derive the next sequence from the HIGHEST existing code instead of the
  // document count. Count-based generation can collide with existing codes
  // (deleted/out-of-order codes) and fail every create with a duplicate-key
  // error ("Failed to create invoice").
  const docs = await Invoice.find({ invoiceCode: new RegExp(`^${prefix}-${year}-`) })
    .select('invoiceCode')
    .lean();
  let maxSeq = 0;
  for (const doc of docs) {
    const parts = doc.invoiceCode.split('-');
    const seq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }
  return `${prefix}-${year}-${String(maxSeq + 1).padStart(6, '0')}`;
};

const generateTransferCode = async (Transfer) => {
  const year = new Date().getFullYear();
  const count = await Transfer.countDocuments({
    transferCode: new RegExp(`^NGV-TRF-${year}`),
  });
  const seq = String(count + 1).padStart(4, '0');
  return `NGV-TRF-${year}-${seq}`;
};

const generateInstallationCode = async (Installation) => {
  const year = new Date().getFullYear();
  const count = await Installation.countDocuments({
    jobCode: new RegExp(`^NGV-INST-${year}`),
  });
  const seq = String(count + 1).padStart(4, '0');
  return `NGV-INST-${year}-${seq}`;
};

const generateDeliveryCode = async (Delivery) => {
  const year = new Date().getFullYear();
  const count = await Delivery.countDocuments({
    deliveryCode: new RegExp(`^NGV-DLV-${year}`),
  });
  const seq = String(count + 1).padStart(4, '0');
  return `NGV-DLV-${year}-${seq}`;
};

const calculateAgeing = (outstandingInvoices) => {
  const now = new Date();
  const buckets = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };

  outstandingInvoices.forEach(item => {
    const dueDate = new Date(item.dueDate || item.date);
    const daysDiff = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 30) buckets['0-30'].push(item);
    else if (daysDiff <= 60) buckets['31-60'].push(item);
    else if (daysDiff <= 90) buckets['61-90'].push(item);
    else buckets['90+'].push(item);
  });

  return Object.entries(buckets).map(([range, items]) => ({
    range,
    count: items.length,
    total: items.reduce((sum, i) => sum + i.amount, 0),
    items,
  }));
};

module.exports = {
  generateInvoiceCode,
  generateTransferCode,
  generateInstallationCode,
  generateDeliveryCode,
  calculateAgeing,
};
