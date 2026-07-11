import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import FormField from '../components/FormField.jsx';
import Toast from '../components/Toast.jsx';
import { useToast } from '../components/useToast.js';
import { registerRequest } from '../api/authApi.js';
import { getApiErrorMessage, isValidEmail } from '../utils/validators.js';

const INITIAL_FORM = { name: '', email: '', password: '' };
const MIN_PASSWORD_LENGTH = 6;

function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  return errors;
}

function Register() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/login', { state: { registered: true }, replace: true });
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Unable to register. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <div className="w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Register</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create an account to get started.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            label="Name"
            id="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            autoComplete="name"
            placeholder="Jane Doe"
          />
          <FormField
            label="Email"
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FormField
            label="Password"
            id="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
            placeholder="••••••••"
          />

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account…' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>

      <Toast toast={toast} onClose={hideToast} />
    </section>
  );
}

export default Register;
