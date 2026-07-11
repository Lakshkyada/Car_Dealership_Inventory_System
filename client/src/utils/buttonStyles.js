const VARIANT_CLASSES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function getButtonClasses(variant = 'primary', className = '') {
  const variantClasses = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
  return `rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses} ${className}`.trim();
}
