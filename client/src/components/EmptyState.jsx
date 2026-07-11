function EmptyState({ title, message }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-md border border-dashed border-gray-300 px-4 py-12 text-center">
      <svg
        className="h-10 w-10 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0l-1.5 6.5a2 2 0 01-2 1.5H9.5a2 2 0 01-2-1.5L6 13m14 0H4"
        />
      </svg>
      <p className="mt-3 font-medium text-gray-700">{title}</p>
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
    </div>
  );
}

export default EmptyState;
