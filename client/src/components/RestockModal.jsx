import { useEffect, useState } from 'react';
import FormField from './FormField.jsx';

function RestockModal({ isOpen, vehicle, onClose, onSubmit, isSubmitting, error }) {
  const [quantity, setQuantity] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setValidationError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    setQuantity(event.target.value);
    setValidationError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const numericQuantity = Number(quantity);
    if (quantity === '' || Number.isNaN(numericQuantity) || numericQuantity <= 0) {
      setValidationError('Quantity must be greater than 0');
      return;
    }

    onSubmit(numericQuantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">
          Restock {vehicle?.make} {vehicle?.model}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Current quantity: {vehicle?.quantity}
        </p>

        <form onSubmit={handleSubmit} className="mt-4" noValidate>
          <FormField
            label="Quantity to add"
            id="restockQuantity"
            type="number"
            value={quantity}
            onChange={handleChange}
            error={validationError}
            placeholder="e.g. 5"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Restocking…' : 'Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RestockModal;
