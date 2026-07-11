import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="text-5xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">
        Sorry, the page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Back to Home
      </Link>
    </section>
  );
}

export default NotFound;
