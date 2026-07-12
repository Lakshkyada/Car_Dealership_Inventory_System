import Button from './Button.jsx';
import Spinner from './Spinner.jsx';
import { formatCurrency } from '../utils/format.js';

/**
 * Injects Cloudinary transformation parameters into a Cloudinary image URL.
 * Supports both /upload/ and /image/upload/ URL forms.
 */
function getCloudinaryUrl(url) {
  if (!url) return url;
  const TRANSFORMS = 'w_400,h_300,c_fill,g_auto,q_auto,f_auto';
  // Insert transformations before the version or file path
  return url.replace(/\/upload\//, `/upload/${TRANSFORMS}/`);
}

function VehicleCard({
  vehicle,
  isOwner,
  onPurchase,
  isPurchasing,
  onEdit,
  onDelete,
  onRestock,
}) {
  const isOutOfStock = vehicle.quantity <= 0;
  const imageUrl = getCloudinaryUrl(vehicle.imageUrl);

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden">
      {/* Vehicle Image */}
      {imageUrl && (
        <div className="w-full h-[180px] bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover rounded-t-xl"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex flex-col flex-1 p-5">
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

        {isOwner ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => onEdit?.(vehicle)}>
              Edit
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => onRestock?.(vehicle)}>
              Restock
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => onDelete?.(vehicle)}>
              Delete
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onPurchase?.(vehicle)}
            disabled={isOutOfStock || isPurchasing}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isPurchasing && <Spinner className="h-4 w-4" />}
            {isOutOfStock ? 'Out of Stock' : isPurchasing ? 'Purchasing…' : 'Purchase'}
          </button>
        )}
      </div>
    </div>
  );
}

export default VehicleCard;
