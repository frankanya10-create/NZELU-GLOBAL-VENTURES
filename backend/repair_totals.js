// One-time repair: recompute subtotal / grandTotal / balanceDue for every
// stored invoice from its line items, using the SAME math as the model's
// pre('save') hook. Uses updateOne($set) so it does NOT touch status /
// paymentStatus / isSupplied (those are set by business flows).
//
// Run with:  node repair_totals.js
// Requires network access to MONGODB_URI in .env

require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Scanning invoices...');

  const invoices = await Invoice.find({ isDeleted: { $ne: true } }).lean();
  let fixed = 0;

  for (const inv of invoices) {
    const items = inv.items || [];
    if (items.length === 0) continue;

    const subtotal = items.reduce((sum, it) => sum + ((it.quantity || 0) * (it.unitPrice || 0)), 0);
    const discount = inv.discount || 0;
    const grandTotal = Math.max(0, subtotal - discount);
    const amountPaid = inv.amountPaid || 0;
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    if (subtotal !== inv.subtotal || grandTotal !== inv.grandTotal || balanceDue !== inv.balanceDue) {
      await Invoice.updateOne(
        { _id: inv._id },
        { $set: { subtotal, grandTotal, balanceDue } }
      );
      fixed++;
      console.log(`FIXED ${inv.invoiceCode}: subtotal ${inv.subtotal}->${subtotal}, grandTotal ${inv.grandTotal}->${grandTotal}, balanceDue ${inv.balanceDue}->${balanceDue}`);
    }
  }

  console.log(`Done. ${fixed} invoice(s) reconciled out of ${invoices.length}.`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('ERROR:', e.message);
  await mongoose.disconnect();
  process.exit(1);
});
