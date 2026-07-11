import { useState } from 'react';
import FormField from './FormField.jsx';

const INITIAL_FORM = { make: '', model: '', category: '', price: '', quantity: '' };

function validate(form) {
  const errors = {};

  if (!form.make.trim()) errors.make = 'Make is required';
  if (!form.model.trim()) errors.model = 'Model is required';
  if (!form.category.trim()) errors.category = 'Category is required';

  if (form.price === '') {
    errors.price = 'Price is required';
  } else if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
    errors.price = 'Price must be a non-negative number';
  }

  if (form.quantity === '') {
    errors.quantity = 'Quantity is required';
  } else if (Number.isNaN(Number(form.quantity)) || Number(form.quantity) < 0) {
    errors.quantity = 'Quantity must be a non-negative number';
  }

  return errors;
}

function VehicleForm({ initialValues, onSubmit, isSubmitting, submitLabel = 'Save', apiError }) {
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, ...initialValues }));
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSubmit({
      make: form.make.trim(),
      model: form.model.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{apiError}</div>
      )}

      <FormField
        label="Make"
        id="make"
        value={form.make}
        onChange={handleChange}
        error={errors.make}
        placeholder="Toyota"
      />
      <FormField
        label="Model"
        id="model"
        value={form.model}
        onChange={handleChange}
        error={errors.model}
        placeholder="Camry"
      />
      <FormField
        label="Category"
        id="category"
        value={form.category}
        onChange={handleChange}
        error={errors.category}
        placeholder="Sedan"
      />
      <FormField
        label="Price"
        id="price"
        type="number"
        value={form.price}
        onChange={handleChange}
        error={errors.price}
        placeholder="25000"
      />
      <FormField
        label="Quantity"
        id="quantity"
        type="number"
        value={form.quantity}
        onChange={handleChange}
        error={errors.quantity}
        placeholder="5"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

export default VehicleForm;
