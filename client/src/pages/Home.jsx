import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard.jsx';
import SearchFilter from '../components/SearchFilter.jsx';
import { fetchVehicles, purchaseVehicle, searchVehicles } from '../api/vehicleApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/validators.js';

function Home() {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchasingIds, setPurchasingIds] = useState(new Set());
  const [feedback, setFeedback] = useState(null);

  const loadVehicles = (request) => {
    setIsLoading(true);
    setError('');
    setFeedback(null);

    request
      .then(({ data }) => setVehicles(data))
      .catch((err) => {
        setError(getApiErrorMessage(err, 'Unable to load vehicles. Please try again.'));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    loadVehicles(fetchVehicles());
  }, [isAuthenticated]);

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

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Welcome to AutoLot Dealership
        </h1>
        <p className="mt-4 text-gray-600">
          Please{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            login
          </Link>{' '}
          or{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            register
          </Link>{' '}
          to view our vehicle inventory.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900">Vehicle Inventory</h1>

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
          No vehicles found.
        </div>
      )}

      {!isLoading && !error && vehicles.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              onPurchase={handlePurchase}
              isPurchasing={purchasingIds.has(vehicle._id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Home;
