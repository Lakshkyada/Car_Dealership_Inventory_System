import Spinner from './Spinner.jsx';
import { getButtonClasses } from '../utils/buttonStyles.js';

function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  isLoading = false,
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={getButtonClasses(variant, className)}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {isLoading && <Spinner className="h-4 w-4" />}
        {children}
      </span>
    </button>
  );
}

export default Button;
