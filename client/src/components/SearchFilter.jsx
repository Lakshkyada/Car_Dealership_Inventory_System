import { useState } from 'react';

const INITIAL_FILTERS = {
  make: '',
  model: '',
  category: '',
  minPrice: '',
  maxPrice: '',
};

const inputClasses =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

function SearchFilter({ onSearch, onReset, isSearching }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim() !== '') {
        params[key] = value.trim();
      }
    });

    onSearch(params);
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    onReset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
    >
      <input
        name="make"
        value={filters.make}
        onChange={handleChange}
        placeholder="Make"
        className={inputClasses}
      />
      <input
        name="model"
        value={filters.model}
        onChange={handleChange}
        placeholder="Model"
        className={inputClasses}
      />
      <input
        name="category"
        value={filters.category}
        onChange={handleChange}
        placeholder="Category"
        className={inputClasses}
      />
      <input
        name="minPrice"
        type="number"
        min="0"
        value={filters.minPrice}
        onChange={handleChange}
        placeholder="Min Price"
        className={inputClasses}
      />
      <input
        name="maxPrice"
        type="number"
        min="0"
        value={filters.maxPrice}
        onChange={handleChange}
        placeholder="Max Price"
        className={inputClasses}
      />

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSearching ? 'Searching…' : 'Search'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSearching}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </form>
  );
}

export default SearchFilter;
