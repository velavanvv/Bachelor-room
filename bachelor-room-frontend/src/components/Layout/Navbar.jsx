import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiUser } from 'react-icons/fi';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white shadow-md">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-600 text-sm">
            {user?.role === 'admin' ? 'Administrator' : 'Member'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 px-4 py-2 rounded-full">
            <FiUser className="text-gray-600 mr-2" />
            <span className="font-medium">{user?.name}</span>
            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;