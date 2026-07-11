import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} AutoLot Dealership. All rights reserved.
      </footer>
    </div>
  );
}

export default MainLayout;
