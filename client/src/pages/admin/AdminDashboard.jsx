import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getButtonClasses } from '../../utils/buttonStyles.js';
import VehicleTable from '../../components/VehicleTable.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import RestockModal from '../../components/RestockModal.jsx';
import { deleteVehicle, fetchVehicles, restockVehicle } from '../../api/vehicleApi.js';
import { getApiErrorMessage } from '../../utils/validators.js';

function AdminDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [vehiclePendingDelete, setVehiclePendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [vehiclePendingRestock, setVehiclePendingRestock] = useState(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockError, setRestockError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const loadVehicles = () => {
    setIsLoading(true);
    setError('');

    fetchVehicles()
      .then(({ data }) => setVehicles(data))
      .catch((err) => setError(getApiErrorMessage(err, 'Unable to load vehicles.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setFeedback({ type: 'success', message: location.state.message });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleDeleteConfirm = async () => {
    if (!vehiclePendingDelete) return;

    setIsDeleting(true);
    try {
      await deleteVehicle(vehiclePendingDelete._id);
      setVehicles((prev) => prev.filter((item) => item._id !== vehiclePendingDelete._id));
      setFeedback({ type: 'success', message: 'Vehicle deleted successfully.' });
      setVehiclePendingDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err, 'Unable to delete vehicle. Please try again.'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestockSubmit = async (quantity) => {
    if (!vehiclePendingRestock) return;

    setIsRestocking(true);
    setRestockError('');
    try {
      const { data: updatedVehicle } = await restockVehicle(vehiclePendingRestock._id, quantity);
      setVehicles((prev) =>
        prev.map((item) => (item._id === updatedVehicle._id ? updatedVehicle : item))
      );
      setFeedback({
        type: 'success',
        message: `Restocked ${updatedVehicle.make} ${updatedVehicle.model} successfully.`,
      });
      setVehiclePendingRestock(null);
    } catch (err) {
      setRestockError(getApiErrorMessage(err, 'Unable to restock vehicle. Please try again.'));
    } finally {
      setIsRestocking(false);
    }
  };

  const handleCloseRestockModal = () => {
    setVehiclePendingRestock(null);
    setRestockError('');
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Link to="/admin/vehicles/new" className={getButtonClasses('primary')}>
          Add Vehicle
        </Link>
      </div>

      {feedback && (
        <div
          className={`mt-6 rounded-md px-4 py-3 text-center text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {isLoading && <p className="mt-10 text-center text-gray-500">Loading vehicles…</p>}

      {!isLoading && error && (
        <div className="mt-10 rounded-md bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && vehicles.length === 0 && (
        <div className="mt-10 rounded-md border border-dashed border-gray-300 px-4 py-10 text-center text-gray-500">
          No vehicles found. Add one to get started.
        </div>
      )}

      {!isLoading && !error && vehicles.length > 0 && (
        <div className="mt-6">
          <VehicleTable
            vehicles={vehicles}
            onEdit={(vehicle) =>
              navigate(`/admin/vehicles/${vehicle._id}/edit`, { state: { vehicle } })
            }
            onDelete={(vehicle) => setVehiclePendingDelete(vehicle)}
            onRestock={(vehicle) => setVehiclePendingRestock(vehicle)}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(vehiclePendingDelete)}
        title="Delete Vehicle"
        message={
          vehiclePendingDelete
            ? `Are you sure you want to delete ${vehiclePendingDelete.make} ${vehiclePendingDelete.model}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setVehiclePendingDelete(null)}
        isConfirming={isDeleting}
      />

      <RestockModal
        isOpen={Boolean(vehiclePendingRestock)}
        vehicle={vehiclePendingRestock}
        onClose={handleCloseRestockModal}
        onSubmit={handleRestockSubmit}
        isSubmitting={isRestocking}
        error={restockError}
      />
    </section>
  );
}

export default AdminDashboard;
