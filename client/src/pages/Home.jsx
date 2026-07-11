import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard.jsx';
import SearchFilter from '../components/SearchFilter.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import RestockModal from '../components/RestockModal.jsx';
import { getButtonClasses } from '../utils/buttonStyles.js';
import {
  deleteVehicle,
  fetchVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
} from '../api/vehicleApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/validators.js';

function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchasingIds, setPurchasingIds] = useState(new Set());
  const [feedback, setFeedback] = useState(null);

  const [vehiclePendingDelete, setVehiclePendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [vehiclePendingRestock, setVehiclePendingRestock] = useState(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockError, setRestockError] = useState('');

  const loadVehicles = (request) => {
    setIsLoading(true);
    setError('');

    request
      .then(({ data }) => setVehicles(data))
      .catch((err) => {
        setError(getApiErrorMessage(err, 'Unable to load vehicles. Please try again.'));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadVehicles(fetchVehicles());
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setFeedback({ type: 'success', message: location.state.message });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSearch = (params) => {
    loadVehicles(searchVehicles(params));
  };

  const handleReset = () => {
    loadVehicles(fetchVehicles());
  };

  const handlePurchase = async (vehicle) => {
    setFeedback(null);
    setPurchasingIds((prev) => new Set(prev).add(vehicle._id));

    try {
      const { data: updatedVehicle } = await purchaseVehicle(vehicle._id);
      setVehicles((prev) =>
        prev.map((item) => (item._id === updatedVehicle._id ? updatedVehicle : item))
      );
      setFeedback({
        type: 'success',
        message: `Successfully purchased ${vehicle.make} ${vehicle.model}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(err, 'Unable to complete purchase. Please try again.'),
      });
    } finally {
      setPurchasingIds((prev) => {
        const next = new Set(prev);
        next.delete(vehicle._id);
        return next;
      });
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Inventory</h1>
        <Link to="/vehicles/new" className={getButtonClasses('primary')}>
          Add Vehicle
        </Link>
      </div>

      <div className="mt-6">
        <SearchFilter onSearch={handleSearch} onReset={handleReset} isSearching={isLoading} />
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

      {isLoading && (
        <div className="mt-10 flex justify-center">
          <p className="text-gray-500">Loading vehicles…</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="mt-10 rounded-md bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && vehicles.length === 0 && (
        <div className="mt-10 rounded-md border border-dashed border-gray-300 px-4 py-10 text-center text-gray-500">
          No vehicles found. Try adjusting your search filters.
        </div>
      )}

      {!isLoading && !error && vehicles.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              isOwner={Boolean(user?._id) && vehicle.owner === user._id}
              onPurchase={handlePurchase}
              isPurchasing={purchasingIds.has(vehicle._id)}
              onEdit={(item) => navigate(`/vehicles/${item._id}/edit`, { state: { vehicle: item } })}
              onDelete={(item) => setVehiclePendingDelete(item)}
              onRestock={(item) => setVehiclePendingRestock(item)}
            />
          ))}
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

export default Home;
