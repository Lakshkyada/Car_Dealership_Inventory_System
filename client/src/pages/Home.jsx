import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VehicleCard from '../components/VehicleCard.jsx';
import { fetchVehicles } from '../api/vehicleApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/validators.js';

function Home() {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');

    fetchVehicles()
      .then(({ data }) => {
        if (isMounted) setVehicles(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(getApiErrorMessage(err, 'Unable to load vehicles. Please try again.'));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

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
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Home;
