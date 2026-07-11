import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkClasses = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
  }`;

const buttonClasses =
  'rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const isAdmin = user?.role === 'ADMIN';

  const navLinks = isAuthenticated
    ? [
        { to: '/', label: 'Home' },
        ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="text-lg font-bold text-blue-600">
          AutoLot Dealership
        </NavLink>

        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses} end>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <>
              {user?.name && (
                <span className="px-2 text-sm text-gray-500">
                  Hi, {user.name}
                </span>
              )}
              <button type="button" onClick={handleLogout} className={buttonClasses}>
                Logout
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-blue-50 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-1 border-t border-gray-200 px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={linkClasses}
              end
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <button type="button" onClick={handleLogout} className={buttonClasses}>
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
