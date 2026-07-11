import { formatCurrency } from '../utils/format.js';

function VehicleCard({ vehicle, onPurchase, isPurchasing }) {
  const isOutOfStock = vehicle.quantity <= 0;

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {vehicle.make} {vehicle.model}
        </h3>
        {isOutOfStock ? (
          <span className="whitespace-nowrap rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
            Out of Stock
          </span>
        ) : (
          <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            In Stock
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-gray-500">{vehicle.category}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-bold text-blue-600">
          {formatCurrency(vehicle.price)}
        </span>
        <span className="text-sm text-gray-600">Qty: {vehicle.quantity}</span>
      </div>

      <button
        type="button"
        onClick={() => onPurchase?.(vehicle)}
        disabled={isOutOfStock || isPurchasing}
        className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      >
        {isOutOfStock ? 'Out of Stock' : isPurchasing ? 'Purchasing…' : 'Purchase'}
      </button>
    </div>
  );
}

export default VehicleCard;
