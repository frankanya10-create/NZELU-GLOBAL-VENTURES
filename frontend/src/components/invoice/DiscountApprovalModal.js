'use client';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';

export default function DiscountApprovalModal({ isOpen, onClose, discount, onApprove, approving }) {
  const [otp, setOtp] = useState('');

  const handleApprove = () => {
    onApprove(otp);
    setOtp('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supervisor Discount Approval Required" size="sm">
      <p className="text-sm text-surface-600 mb-4">
        A discount of <strong className="text-red-600">₦{discount.toLocaleString()}</strong> requires a Manager or Admin approval.
        Enter the supervisor authorization code below.
      </p>
      <input type="text" value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="Enter 6-digit approval code"
        className="ngv-input text-center text-lg font-mono tracking-widest mb-4" maxLength={6} />
      <div className="flex gap-3">
        <button onClick={onClose} className="ngv-btn-secondary flex-1">Cancel</button>
        <button onClick={handleApprove} disabled={otp.length !== 6 || approving}
          className="ngv-btn-primary flex-1">
          {approving ? 'Verifying...' : 'Approve & Continue'}
        </button>
      </div>
    </Modal>
  );
}
