import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleForm from '../../components/VehicleForm.jsx';
import { createVehicle } from '../../api/vehicleApi.js';
import { getApiErrorMessage } from '../../utils/validators.js';

function AddVehicle() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      await createVehicle(values);
      navigate('/admin', { state: { message: 'Vehicle added successfully.' } });
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Unable to add vehicle. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Add Vehicle</h1>
        <p className="mt-2 text-sm text-gray-600">
          Fill in the details to add a new vehicle to the inventory.
        </p>

        <div className="mt-6">
          <VehicleForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Add Vehicle"
            apiError={apiError}
          />
        </div>
      </div>
    </section>
  );
}

export default AddVehicle;
