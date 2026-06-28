'use client';

export default function BankDetails() {
  return (
    <div className="ngv-card border-ngv-200 bg-ngv-50/30">
      <div className="ngv-card-body">
        <h4 className="font-semibold text-ngv-800 mb-3">Bank Details for Payment</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-600">Account Number:</span>
            <span className="font-mono font-bold text-ngv-800">2284429344</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">Account Name:</span>
            <span className="font-medium">Nzelu Akachukwu</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-600">Bank:</span>
            <span className="font-medium">Zenith Bank</span>
          </div>
        </div>
      </div>
    </div>
  );
}
