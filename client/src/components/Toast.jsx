function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 left-4 z-60 mx-auto flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg sm:left-auto sm:mx-0 ${
        isSuccess
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

export default Toast;
