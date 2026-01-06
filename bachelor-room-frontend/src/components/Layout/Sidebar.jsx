import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiDollarSign,
  FiCreditCard,
  FiPieChart,
  FiUsers,
  FiUser,

  FiLogOut,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const Sidebar = () => {
  const { logout, isAdmin, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const memberMenu = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/contributions', icon: FiCreditCard, label: 'Contributions' },
    { to: '/expenses', icon: FiDollarSign, label: 'Expenses' },
    { to: '/wallet', icon: FiPieChart, label: 'Wallet' },
  ];

  const adminMenu = [
    { to: '/admin', icon: FiHome, label: 'Admin Dashboard' },
    { to: '/admin/users', icon: FiUsers, label: 'Manage Users' },
  ];

  const menuItems = isAdmin() ? [...adminMenu, ...memberMenu] : memberMenu;

  // Close mobile sidebar when route changes
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white shadow-md text-gray-700"
      >
        <FiMenu size={24} />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:sticky top-0 left-0 z-50
          h-screen transition-transform duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          bg-gradient-to-b from-gray-900 to-gray-800 text-white
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-300 hover:text-white"
        >
          <FiX size={24} />
        </button>

        {/* Collapse button for desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-6 bg-white rounded-full p-1.5 shadow-md text-gray-700 hover:text-primary-600"
        >
          {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          {!isCollapsed ? (
            <>
              <h1 className="text-2xl font-bold tracking-tight">RoomMate</h1>
              <p className="text-gray-400 text-sm mt-1">Management System</p>
            </>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `
                  flex items-center rounded-lg mb-1
                  ${isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'}
                  ${isActive ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                  transition-all duration-200
                `
              }
            >
              <item.icon className={isCollapsed ? '' : 'mr-3'} size={isCollapsed ? 20 : 18} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700 bg-gray-900/50 backdrop-blur-sm">
          {!isCollapsed ? (
            <>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                  <FiUser size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{isAdmin() ? 'Administrator' : 'Member'}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiLogOut className="mr-2" size={18} />
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <FiUser size={18} />
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                title="Logout"
              >
                <FiLogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;