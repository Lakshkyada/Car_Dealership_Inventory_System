import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Shows a toast for a message passed via router navigation state
 * (e.g. `navigate('/', { state: { message: 'Success!' } })`),
 * then clears that state so the message doesn't reappear on refresh/back.
 */
export function useRedirectToast(showToast) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type ?? 'success');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, showToast]);
}
