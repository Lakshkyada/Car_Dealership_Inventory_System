import { formatCurrency } from '../utils/format.js';

function VehicleTable({ vehicles, onEdit, onDelete, onRestock }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-semibold text-gray-700">Make</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Model</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Category</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Price</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Quantity</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {vehicles.map((vehicle) => (
            <tr key={vehicle._id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                {vehicle.make}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-700">{vehicle.model}</td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-700">{vehicle.category}</td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                {formatCurrency(vehicle.price)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                {vehicle.quantity}
                {vehicle.quantity <= 0 && (
                  <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Out of Stock
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(vehicle)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onRestock(vehicle)}
                    className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
                  >
                    Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(vehicle)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VehicleTable;
