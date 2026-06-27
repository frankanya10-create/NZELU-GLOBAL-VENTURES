'use client';

export default function BankDetails() {
  return (
    <div className="ngv-card border-ngv-200 bg-ngv-50/30">
      <div className="ngv-card-body">
        <h4 className="font-semibold text-ngv-800 mb-3">Bank Details for Payment</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-600">Bank:</span>
            <span className="font-medium">Opay</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">Account Name:</span>
            <span className="font-medium">NGV Enterprise Ltd</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">Account Number:</span>
            <span className="font-mono font-bold text-ngv-800">803 123 4567</span>
          </div>
          <div className="mt-3 pt-3 border-t border-ngv-200 text-xs text-surface-500">
            <p>All proforma invoices require a 50% mobilization deposit before production begins.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
