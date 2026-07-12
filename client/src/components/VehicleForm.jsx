import { useRef, useState } from 'react';
import Button from './Button.jsx';
import FormField from './FormField.jsx';

const INITIAL_FORM = { make: '', model: '', category: '', price: '', quantity: '' };

function validate(form, imageFile, isEdit) {
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

  if (!isEdit && !imageFile) {
    errors.image = 'Vehicle image is required';
  }

  return errors;
}

function VehicleForm({ initialValues, onSubmit, isSubmitting, submitLabel = 'Save', isEdit = false, currentImageUrl }) {
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, ...initialValues }));
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentImageUrl || null);
  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageFile(file);
    setErrors((prev) => ({ ...prev, image: undefined }));

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(isEdit ? currentImageUrl || null : null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validate(form, imageFile, isEdit);
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
      image: imageFile || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Vehicle Image{!isEdit && <span className="text-red-500 ml-1">*</span>}
          {isEdit && <span className="ml-1 text-xs text-gray-400">(leave blank to keep current)</span>}
        </label>

        {imagePreview && (
          <div className="mt-2 relative inline-block">
            <img
              src={imagePreview}
              alt="Vehicle preview"
              className="h-36 w-full max-w-xs rounded-lg object-cover border border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        )}

        <div className={`mt-2 flex items-center gap-3 ${imagePreview ? 'mt-2' : 'mt-1'}`}>
          <label
            htmlFor="image"
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            {imagePreview ? 'Change Image' : 'Choose Image'}
          </label>
          <input
            ref={fileInputRef}
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageChange}
            className="sr-only"
          />
          {imageFile && (
            <span className="text-xs text-gray-500 truncate max-w-[160px]">{imageFile.name}</span>
          )}
        </div>

        {errors.image && (
          <p className="mt-1 text-sm text-red-600">{errors.image}</p>
        )}
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}

export default VehicleForm;
