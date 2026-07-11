import Button from './Button.jsx';

function ErrorState({ message, onRetry }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-md bg-red-50 px-4 py-8 text-center">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
