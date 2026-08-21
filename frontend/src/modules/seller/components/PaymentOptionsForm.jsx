import React from 'react';
import { CreditCard } from 'lucide-react';

const PaymentOptionsForm = ({ formData, handleFieldChange }) => {
  const paymentOptions = ['UPI', 'Credit/Debit Card', 'Net Banking', 'EMI', 'Pay on Delivery', 'Advance + Balance'];

  const paymentData = formData.paymentOptions || [];

  const handlePaymentChange = (option) => {
    const updated = paymentData.includes(option)
      ? paymentData.filter(p => p !== option)
      : [...paymentData, option];
    handleFieldChange('paymentOptions', updated);
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1 block">
        <CreditCard size={14} className="inline mr-1" /> Payment Options
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {paymentOptions.map((option) => (
          <label key={option} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors border border-slate-200" style={{borderColor: paymentData.includes(option) ? '#A855F7' : '#E2E8F0'}}>
            <input
              type="checkbox"
              checked={paymentData.includes(option) || false}
              onChange={() => handlePaymentChange(option)}
              className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PaymentOptionsForm;
