import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormCard from '../../components/FormCard.jsx';
import VehicleForm from '../../components/VehicleForm.jsx';
import Toast from '../../components/Toast.jsx';
import { useToast } from '../../components/useToast.js';
import { createVehicle } from '../../api/vehicleApi.js';
import { getApiErrorMessage } from '../../utils/validators.js';

function AddVehicle() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      await createVehicle(values);
      navigate('/', { state: { message: 'Vehicle added successfully.' } });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to add vehicle. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormCard
        title="Add Vehicle"
        description="Fill in the details to add a new vehicle to the inventory."
      >
        <div className="mt-6">
          <VehicleForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Add Vehicle" />
        </div>
      </FormCard>

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}

export default AddVehicle;
