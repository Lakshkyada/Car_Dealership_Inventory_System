import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import VehicleForm from '../../components/VehicleForm.jsx';
import { fetchVehicles, updateVehicle } from '../../api/vehicleApi.js';
import { getApiErrorMessage } from '../../utils/validators.js';

function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicle, setVehicle] = useState(location.state?.vehicle ?? null);
  const [isLoading, setIsLoading] = useState(!location.state?.vehicle);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (vehicle) return;

    setIsLoading(true);
    fetchVehicles()
      .then(({ data }) => {
        const found = data.find((item) => item._id === id);
        if (!found) {
          setLoadError('Vehicle not found.');
        } else {
          setVehicle(found);
        }
      })
      .catch((err) => setLoadError(getApiErrorMessage(err, 'Unable to load vehicle.')))
      .finally(() => setIsLoading(false));
  }, [id, vehicle]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setApiError('');

    try {
      await updateVehicle(id, values);
      navigate('/admin', { state: { message: 'Vehicle updated successfully.' } });
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Unable to update vehicle. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
        <p className="mt-2 text-sm text-gray-600">Update the vehicle details below.</p>

        {isLoading && <p className="mt-6 text-sm text-gray-500">Loading vehicle…</p>}

        {!isLoading && loadError && (
          <div className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}{' '}
            <Link to="/admin" className="font-medium underline">
              Back to Admin Dashboard
            </Link>
          </div>
        )}

        {!isLoading && !loadError && vehicle && (
          <div className="mt-6">
            <VehicleForm
              initialValues={{
                make: vehicle.make,
                model: vehicle.model,
                category: vehicle.category,
                price: vehicle.price,
                quantity: vehicle.quantity,
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Save Changes"
              apiError={apiError}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default EditVehicle;
