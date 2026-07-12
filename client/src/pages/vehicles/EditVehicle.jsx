import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import FormCard from '../../components/FormCard.jsx';
import VehicleForm from '../../components/VehicleForm.jsx';
import Toast from '../../components/Toast.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useToast } from '../../components/useToast.js';
import { fetchVehicles, updateVehicle } from '../../api/vehicleApi.js';
import { useAuth } from '../../context/useAuth.js';
import { getApiErrorMessage } from '../../utils/validators.js';

function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [vehicle, setVehicle] = useState(location.state?.vehicle ?? null);
  const [isLoading, setIsLoading] = useState(!location.state?.vehicle);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vehicle) return;

    setIsLoading(true);
    fetchVehicles()
      .then(({ data }) => {
        // fetchVehicles returns a paginated envelope: { vehicles, ... }
        const list = Array.isArray(data) ? data : (data.vehicles ?? []);
        const found = list.find((item) => item._id === id);
        if (!found) {
          setLoadError('Vehicle not found.');
        } else {
          setVehicle(found);
        }
      })
      .catch((err) => setLoadError(getApiErrorMessage(err, 'Unable to load vehicle.')))
      .finally(() => setIsLoading(false));
  }, [id, vehicle]);

  const isOwner = vehicle && user?._id && vehicle.owner === user._id;

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      await updateVehicle(id, values);
      navigate('/', { state: { message: 'Vehicle updated successfully.' } });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to update vehicle. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormCard title="Edit Vehicle" description="Update the vehicle details below.">
        {isLoading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <Spinner className="h-4 w-4" />
            <span>Loading vehicle…</span>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}{' '}
            <Link to="/" className="font-medium underline">
              Back to Home
            </Link>
          </div>
        )}

        {!isLoading && !loadError && vehicle && !isOwner && (
          <div className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            You are not authorized to edit this vehicle.{' '}
            <Link to="/" className="font-medium underline">
              Back to Home
            </Link>
          </div>
        )}

        {!isLoading && !loadError && vehicle && isOwner && (
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
              isEdit={true}
              currentImageUrl={vehicle.imageUrl}
            />
          </div>
        )}
      </FormCard>

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}

export default EditVehicle;
