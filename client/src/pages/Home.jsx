import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard.jsx';
import SearchFilter from '../components/SearchFilter.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import RestockModal from '../components/RestockModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Spinner from '../components/Spinner.jsx';
import Toast from '../components/Toast.jsx';
import { useToast } from '../components/useToast.js';
import { useRedirectToast } from '../components/useRedirectToast.js';
import { getButtonClasses } from '../utils/buttonStyles.js';
import {
  deleteVehicle,
  fetchVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
} from '../api/vehicleApi.js';
import { useAuth } from '../context/useAuth.js';
import { getApiErrorMessage } from '../utils/validators.js';

const PAGE_LIMIT = 9;

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  useRedirectToast(showToast);

  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchasingIds, setPurchasingIds] = useState(new Set());
  const [lastRequest, setLastRequest] = useState({ type: 'all', params: undefined });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);

  const [vehiclePendingDelete, setVehiclePendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [vehiclePendingRestock, setVehiclePendingRestock] = useState(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [restockError, setRestockError] = useState('');

  const loadVehicles = (request, isSearchMode = false) => {
    setIsLoading(true);
    setError('');

    request
      .then(({ data }) => {
        if (isSearchMode) {
          // Search returns a flat array
          setVehicles(Array.isArray(data) ? data : data.vehicles ?? []);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalVehicles(Array.isArray(data) ? data.length : data.totalVehicles ?? 0);
        } else {
          // Paginated response
          setVehicles(data.vehicles ?? []);
          setCurrentPage(data.currentPage ?? 1);
          setTotalPages(data.totalPages ?? 1);
          setTotalVehicles(data.totalVehicles ?? 0);
        }
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, 'Unable to load vehicles. Please try again.'));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadVehicles(fetchVehicles({ page: currentPage, limit: PAGE_LIMIT }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleSearch = (params) => {
    setLastRequest({ type: 'search', params });
    loadVehicles(searchVehicles(params), true);
  };

  const handleReset = () => {
    setLastRequest({ type: 'all', params: undefined });
    setCurrentPage(1);
    loadVehicles(fetchVehicles({ page: 1, limit: PAGE_LIMIT }));
  };

  const handleRetry = () => {
    if (lastRequest.type === 'search') {
      loadVehicles(searchVehicles(lastRequest.params), true);
    } else {
      loadVehicles(fetchVehicles({ page: currentPage, limit: PAGE_LIMIT }));
    }
  };

  const handlePageChange = (newPage) => {
    setLastRequest({ type: 'all', params: undefined });
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePurchase = async (vehicle) => {
    setPurchasingIds((prev) => new Set(prev).add(vehicle._id));

    try {
      const { data: updatedVehicle } = await purchaseVehicle(vehicle._id);
      setVehicles((prev) =>
        prev.map((item) => (item._id === updatedVehicle._id ? updatedVehicle : item))
      );
      showToast(`Successfully purchased ${vehicle.make} ${vehicle.model}.`, 'success');
    } catch (err) {
      showToast(
        getApiErrorMessage(err, 'Unable to complete purchase. Please try again.'),
        'error'
      );
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

      // After deletion, determine the right page to stay on
      const newTotal = totalVehicles - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / PAGE_LIMIT));
      const targetPage = currentPage > newTotalPages ? newTotalPages : currentPage;

      showToast('Vehicle deleted successfully.', 'success');
      setVehiclePendingDelete(null);

      setCurrentPage(targetPage);
      loadVehicles(fetchVehicles({ page: targetPage, limit: PAGE_LIMIT }));
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Unable to delete vehicle. Please try again.'), 'error');
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
      showToast(`Restocked ${updatedVehicle.make} ${updatedVehicle.model} successfully.`, 'success');
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

  const isSearchMode = lastRequest.type === 'search';

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Vehicle Inventory</h1>
        <Link to="/vehicles/new" className={getButtonClasses('primary')}>
          Add Vehicle
        </Link>
      </div>

      <div className="mt-6">
        <SearchFilter onSearch={handleSearch} onReset={handleReset} isSearching={isLoading} />
      </div>

      {isLoading && (
        <div className="mt-10 flex flex-col items-center justify-center gap-2 text-gray-500">
          <Spinner className="h-8 w-8" />
          <p>Loading vehicles…</p>
        </div>
      )}

      {!isLoading && error && <ErrorState message={error} onRetry={handleRetry} />}

      {!isLoading && !error && vehicles.length === 0 && (
        <EmptyState
          title="No vehicles found"
          message="Try adjusting your search filters, or add a new vehicle to get started."
        />
      )}

      {!isLoading && !error && vehicles.length > 0 && (
        <>
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

          {/* Pagination Controls – only shown in non-search mode */}
          {!isSearchMode && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                id="pagination-prev"
              >
                ← Previous
              </button>

              <span className="text-sm text-gray-600">
                Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalPages}</span>
                <span className="ml-2 text-gray-400">({totalVehicles} vehicles)</span>
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                id="pagination-next"
              >
                Next →
              </button>
            </div>
          )}
        </>
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

      <Toast toast={toast} onClose={hideToast} />
    </section>
  );
}

export default Home;
