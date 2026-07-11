import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import FormCard from '../components/FormCard.jsx';
import FormField from '../components/FormField.jsx';
import Toast from '../components/Toast.jsx';
import { useToast } from '../components/useToast.js';
import { useRedirectToast } from '../components/useRedirectToast.js';
import { loginRequest } from '../api/authApi.js';
import { useAuth } from '../context/useAuth.js';
import { getApiErrorMessage, isValidEmail } from '../utils/validators.js';

const INITIAL_FORM = { email: '', password: '' };

function validate(form) {
  const errors = {};

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!form.password) {
    errors.password = 'Password is required';
  }

  return errors;
}

function Login() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  useRedirectToast(showToast);

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
      const { data } = await loginRequest({
        email: form.email.trim(),
        password: form.password,
      });
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Unable to log in. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormCard title="Login" description="Welcome back! Please enter your details.">
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
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
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {isSubmitting ? 'Logging in…' : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </FormCard>

      <Toast toast={toast} onClose={hideToast} />
    </>
  );
}

export default Login;
