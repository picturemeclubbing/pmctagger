import React, { useState } from 'react';
import { addCustomer, linkSessionToCustomer, findCustomerByContact } from '../../services/CustomerStore';

function CustomerModal({ sessionId, onClose, onComplete }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if customer exists
      let customer = await findCustomerByContact({ phone, email });

      if (!customer && (name || phone || email)) {
        // Create new customer
        const customerId = await addCustomer({ name, phone, email });
        await linkSessionToCustomer(sessionId, customerId);
      } else if (customer) {
        // Link to existing customer
        await linkSessionToCustomer(sessionId, customer.customerId);
      }

      onComplete();
    } catch (error) {
      console.error('Error saving customer:', error);
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Customer Info (Optional)</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white min-h-[32px] min-w-[32px]"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Add customer details to track deliveries (optional)
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              className="
                w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none
                text-base min-h-[44px]
              "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="
                w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none
                text-base min-h-[44px]
              "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="
                w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none
                text-base min-h-[44px]
              "
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="
                flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700
                rounded-lg font-medium hover:bg-gray-50 active:bg-gray-100
                disabled:opacity-50 transition-colors
                text-base min-h-[48px] touch-manipulation
              "
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium
                hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300
                transition-colors text-base min-h-[48px] touch-manipulation
              "
            >
              {isSubmitting ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerModal;
