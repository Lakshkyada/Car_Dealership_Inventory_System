import { getButtonClasses } from '../utils/buttonStyles.js';

function Button({ variant = 'primary', className = '', type = 'button', ...props }) {
  return <button type={type} className={getButtonClasses(variant, className)} {...props} />;
}

export default Button;
