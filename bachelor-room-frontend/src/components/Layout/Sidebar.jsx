import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiDollarSign,
  FiCreditCard,
  FiPieChart,
  FiUsers,
  FiLogOut,
} from 'react-icons/fi';

const Sidebar = () => {
  const { logout, isAdmin } = useAuth();

  const memberMenu = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/contributions', icon: FiCreditCard, label: 'Contributions' },
    { to: '/expenses', icon: FiDollarSign, label: 'Expenses' },
    { to: '/wallet', icon: FiPieChart, label: 'Wallet' },
  ];

  const adminMenu = [
    { to: '/admin', icon: FiHome, label: 'Admin Dashboard' },
    { to: '/admin/users', icon: FiUsers, label: 'Manage Users' },
    ...memberMenu,
  ];

  const menuItems = isAdmin() ? adminMenu : memberMenu;

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold">RoomMate</h1>
        <p className="text-gray-400 text-sm mt-1">Management System</p>
      </div>
      
      <nav className="mt-8">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive ? 'bg-blue-600 text-white' : ''
              }`
            }
          >
            <item.icon className="mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center text-gray-300 hover:text-white w-full"
        >
          <FiLogOut className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;