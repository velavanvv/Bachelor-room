import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiCreditCard, 
  FiDollarSign, 
  FiPieChart,
  FiLogOut,
  FiSettings,
  FiUser,
  FiChevronRight,
  FiChevronLeft
} from 'react-icons/fi';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const adminRoomIds = ['admin-dashboard', 'contributions', 'users'];

const RoomDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarOpen,setNavbarOpen]=useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalContributions: 0,
    totalExpenses: 0,
    currentBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiService.getCurrentWallet();
      const usersResponse = await apiService.getUsers();
      
      const wallet = response.data || { total_collected: 0, total_spent: 0, balance: 0 };
      
      setStats({
        totalMembers: usersResponse.data?.length || 0,
        totalContributions: wallet.total_collected || 0,
        totalExpenses: wallet.total_spent || 0,
        currentBalance: wallet.balance || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const rooms = [

     {
      id: 'expenses',
      title: 'Expense Room',
      description: 'Track & Manage Expenses',
      icon: FiDollarSign,
      color: 'from-red-500 to-red-600',
      doorColor: 'bg-red-700',
      path: '/expenses',
      stats: [
        { label: 'Total', value: `₹${stats.totalExpenses}` },
        { label: 'Recent', value: '₹0' },
      ],
      visible: true
    },
    {
      id: 'dashboard',
      title: 'Main Hall',
      description: 'Overview & Quick Stats',
      icon: FiHome,
      color: 'from-blue-500 to-blue-600',
      doorColor: 'bg-blue-700',
      path: '/dashboard',
      stats: [
        { label: 'Members', value: stats.totalMembers },
        { label: 'Balance', value: `₹${stats.currentBalance}` },
      ],
      visible: true
    },
    {
      id: 'admin-dashboard',
      title: 'Admin Control',
      description: 'Admin Dashboard & Reports',
      icon: FiHome,
      color: 'from-indigo-500 to-indigo-600',
      doorColor: 'bg-indigo-700',
      path: '/admin',
      stats: [
        { label: 'System', value: 'Admin' },
        { label: 'Reports', value: 'Ready' },
      ],
      visible: user?.role === 'admin'
    },
    {
      id: 'contributions',
      title: 'Bank Room',
      description: 'Manage Contributions & Payments',
      icon: FiCreditCard,
      color: 'from-green-500 to-green-600',
      doorColor: 'bg-green-700',
      path: '/contributions',
      stats: [
        { label: 'Total', value: `₹${stats.totalContributions}` },
        { label: 'This Month', value: '₹0' },
      ],
      visible: user?.role === 'admin'
    },
   
    {
      id: 'wallet',
      title: 'Safe Room',
      description: 'Financial Summary & Analytics',
      icon: FiPieChart,
      color: 'from-purple-500 to-purple-600',
      doorColor: 'bg-purple-700',
      path: '/wallet',
      stats: [
        { label: 'Balance', value: `₹${stats.currentBalance}` },
        { label: 'Status', value: stats.currentBalance > 0 ? 'Healthy' : 'Low' },
      ],
      visible: true
    },
    {
      id: 'users',
      title: 'Members Room',
      description: 'Manage Room Members',
      icon: FiUsers,
      color: 'from-orange-500 to-orange-600',
      doorColor: 'bg-orange-700',
      path: user?.role === 'admin' ? '/admin/users' : '/users',
      stats: [
        { label: 'Total', value: stats.totalMembers },
        { label: 'Active', value: stats.totalMembers },
      ],
     visible: user?.role === 'admin'
    },
  ];

  // Filter rooms based on visibility
  const visibleRooms = rooms.filter(room => room.visible);
  const mobileQuickRooms = visibleRooms.slice(0, 4);

  const isAdminRoom = (roomId) => adminRoomIds.includes(roomId);

  
  const handleRoomClick = (room) => {
    if (isAdminRoom(room.id) && user?.role !== 'admin') {
      toast.error('Admin access required for this room!');
      return;
    }

    // Animate door opening
    const door = document.getElementById(`door-${room.id}`);
    if (door) {
      door.style.transform = 'rotateY(-90deg)';
      door.style.transition = 'transform 0.5s ease';
      
      // Navigate after animation
      setTimeout(() => {
        navigate(room.path);
      }, 300);
    } else {
      navigate(room.path);
    }
  };

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      logout();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="loader w-12 h-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,215,96,0.16),_transparent_26%),linear-gradient(180deg,_#07110d_0%,_#0f1915_38%,_#050706_100%)] text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 border-b border-white/8 bg-black/30 backdrop-blur-xl">
        <div className="container-responsive py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3 sm:justify-start sm:space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
              >
                {sidebarOpen ? <FiChevronLeft size={24} /> : <FiChevronRight size={24} />}
              </button>
              <div className="min-w-0 flex-1 sm:flex-none">
                <h1 className="truncate text-lg font-bold sm:text-2xl">Bachelor Room</h1>
                <p className="text-xs text-gray-400 sm:text-sm">Management System</p>
              </div>
              <div onClick={()=>setNavbarOpen(!navbarOpen)} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:hidden ${
                user?.role === 'admin'
                  ? 'bg-gradient-to-r from-red-600 to-red-700'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700'
              }`}>
                <FiUser size={18} />
              </div>
            </div>
            
            <div className={` ${navbarOpen? 'hidden':''} flex items-center justify-between gap-3 sm:justify-end sm:space-x-4`}>
              <div className="min-w-0 sm:hidden">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.role?.toUpperCase()}</p>
              </div>
              <div className="hidden md:block text-right">
                <p className="font-medium">{user?.name}</p>
                <div className="flex items-center justify-end space-x-2">
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    user?.role === 'admin'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                  }`}>
                    {user?.role?.toUpperCase()}
                  </span>
                  <p className="text-sm text-gray-400">User</p>
                </div>
              </div>
              <div className={`hidden w-10 h-10 rounded-full items-center justify-center sm:flex ${
                user?.role === 'admin'
                  ? 'bg-gradient-to-r from-red-600 to-red-700'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700'
              }`}>
                <FiUser size={20} />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 rounded-xl bg-red-600 px-3 py-2 text-sm transition-colors hover:bg-red-700 sm:px-4"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close quick access"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-10 bg-black/40 md:hidden"
          />
        )}
        {/* Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0 opacity-100  ' : '-translate-x-full opacity-0 md:hidden'
        } fixed left-0 top-[73px] z-20 h-[calc(100vh-73px)] w-72 border-r border-white/10 bg-[#0b120f]/95 backdrop-blur-xl transition-all duration-300 md:static md:h-auto md:w-auto md:border-r-0 md:bg-transparent md:backdrop-blur-0 md:opacity-100 md:translate-x-0 ${
          sidebarOpen ? 'md:w-64' : 'md:w-0'
        } md:overflow-hidden`}>
          <div className="p-6 pb-24 md:pb-6">
            <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
            <div className="space-y-2">
              {visibleRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleRoomClick(room)}
                  disabled={isAdminRoom(room.id) && user?.role !== 'admin'}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    isAdminRoom(room.id)
                      ? user?.role === 'admin'
                        ? 'bg-gradient-to-r from-indigo-800/50 to-indigo-900/50 hover:from-indigo-700 hover:to-indigo-800 border-l-4 border-indigo-500'
                        : 'bg-gray-800 opacity-50 cursor-not-allowed'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                  >
                    <room.icon className="mr-3" />
                    <span className="flex-1 text-left">{room.title}</span>
                    {isAdminRoom(room.id) && user?.role !== 'admin' && (
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="font-semibold mb-3">Room Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Balance:</span>
                  <span className="font-medium">₹{stats.currentBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Members:</span>
                  <span className="font-medium">{stats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Your Role:</span>
                  <span className={`font-medium ${
                    user?.role === 'admin' ? 'text-indigo-400' : 'text-green-400'
                  }`}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Quick Actions */}
            {user?.role === 'admin' && (
              <div className="mt-6 p-4 bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 rounded-lg border border-indigo-700/30">
                <h3 className="font-semibold mb-3 text-indigo-300">Admin Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="w-full text-left px-3 py-2 text-sm bg-indigo-800/50 hover:bg-indigo-700 rounded"
                  >
                    Manage Users
                  </button>
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full text-left px-3 py-2 text-sm bg-indigo-800/50 hover:bg-indigo-700 rounded"
                  >
                    Admin Overview
                  </button>
                  <button
                    onClick={() => navigate('/wallet')}
                    className="w-full text-left px-3 py-2 text-sm bg-indigo-800/50 hover:bg-indigo-700 rounded"
                  >
                    Open Wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Room Layout */}
        <div className="flex-1 overflow-x-hidden p-4 pb-28 md:p-6 md:pb-6">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to Your Room!</h1>
            <p className="text-gray-400">
              {user?.role === 'admin' 
                ? 'As an admin, you have access to all rooms including Admin Control.'
                : 'Click on any room door to access different features.'
              }
            </p>
          </div>

          <div className="mb-8 md:hidden">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(30,215,96,0.26),_rgba(10,10,10,0.1)_45%,_rgba(0,0,0,0.45)_100%)] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.35)]">
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Mobile Mix</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold leading-tight">Your room, optimized for phone.</h2>
                  <p className="mt-2 text-sm text-emerald-50/70">
                    Tap into contributions, expenses, and wallet stats with a cleaner mobile flow.
                  </p>
                </div>
                <div className="rounded-2xl bg-black/25 p-3 text-right">
                  <p className="text-xs text-emerald-200/70">Balance</p>
                  <p className="text-lg font-semibold">₹{stats.currentBalance}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-black/25 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/60">Members</p>
                  <p className="mt-1 text-lg font-semibold">{stats.totalMembers}</p>
                </div>
                <div className="rounded-2xl bg-black/25 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/60">Spent</p>
                  <p className="mt-1 text-lg font-semibold">₹{stats.totalExpenses}</p>
                </div>
                <div className="rounded-2xl bg-black/25 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/60">Role</p>
                  <p className="mt-1 text-lg font-semibold">{user?.role === 'admin' ? 'Admin' : 'Member'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Quick Picks</h3>
                <span className="text-xs uppercase tracking-[0.18em] text-emerald-200/60">Mobile view</span>
              </div>
              <div className="space-y-3">
                {visibleRooms.map((room) => (
                  <button
                    key={`mobile-${room.id}`}
                    onClick={() => handleRoomClick(room)}
                    disabled={isAdminRoom(room.id) && user?.role !== 'admin'}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition active:scale-[0.99] ${
                      isAdminRoom(room.id)
                        ? user?.role === 'admin'
                          ? 'border-indigo-400/30 bg-indigo-500/10'
                          : 'border-white/6 bg-white/5 opacity-60'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${room.color}`}>
                        <room.icon size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-semibold">{room.title}</p>
                          {isAdminRoom(room.id) && (
                            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-emerald-50/60">{room.description}</p>
                        <div className="mt-3 flex gap-2">
                          {room.stats.map((stat) => (
                            <span key={`${room.id}-${stat.label}`} className="rounded-full bg-black/20 px-3 py-1 text-xs text-emerald-50/80">
                              {stat.label}: {stat.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <FiChevronRight className="shrink-0 text-emerald-100/60" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Room Grid */}
          <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
            {visibleRooms.map((room) => (
              <div
                key={room.id}
                className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 ${
                 isAdminRoom(room.id) ? 'border-2 border-indigo-500/50 glow-effect' : ''
                }`}
              >
                {/* Admin Badge for Admin Dashboard */}
                {isAdminRoom(room.id) && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-1 rounded-full font-bold text-xs z-20">
                    ADMIN ONLY
                  </div>
                )}

                {/* Room Wall */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl -z-10"></div>
                
                {/* Room Content */}
                <div className="relative z-10">
                  {/* Door Frame */}
                  <div className="relative mb-6">
                    <div className="w-full h-64 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border-4 border-gray-700 flex items-center justify-center overflow-hidden">
                      {/* Door */}
                      <div
                        id={`door-${room.id}`}
                        className={`w-48 h-56 ${room.doorColor} rounded-lg border-4 ${room.doorColor.replace('bg-', 'border-')} flex flex-col items-center justify-center cursor-pointer transform transition-transform duration-300 hover:scale-105 relative ${
                          isAdminRoom(room.id) ? 'room-door' : ''
                        }`}
                        onClick={() => handleRoomClick(room)}
                      >
                        {/* Admin Icon */}
                        {isAdminRoom(room.id) && (
                          <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Door Knob */}
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-yellow-400 rounded-full"></div>
                        
                        {/* Door Content */}
                        <room.icon className="text-white text-4xl mb-3" />
                        <span className="text-white font-semibold text-lg">{room.title}</span>
                        
                        {/* Lock icon for admin room when not admin */}
                        {isAdminRoom(room.id) && user?.role !== 'admin' && (
                          <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Door Sign */}
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full font-bold ${
                      isAdminRoom(room.id) 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                        : ''
                    }`}>
                      {isAdminRoom(room.id) ? 'Admin Access' : ''}
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">{room.title}</h3>
                    <p className="text-gray-400 mb-4">{room.description}</p>
                    
                    {/* Room Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      {room.stats.map((stat, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="text-sm text-gray-400">{stat.label}</div>
                          <div className="font-semibold">{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Enter Button */}
                    <button
                      onClick={() => handleRoomClick(room)}
                      disabled={isAdminRoom(room.id) && user?.role !== 'admin'}
                      className={`mt-6 w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                        isAdminRoom(room.id)
                          ? user?.role === 'admin'
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800'
                            : 'bg-gray-700 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700'
                      }`}
                    >
                      <span>
                        {isAdminRoom(room.id) && user?.role !== 'admin' 
                          ? 'Admin Access Required' 
                          : `Enter ${room.title}`}
                      </span>
                      <FiChevronRight className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Info Section */}
          <div className="mt-12 hidden grid-cols-1 gap-6 md:grid md:grid-cols-3">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-6 border border-blue-700/30">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <FiHome size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">How it Works</h3>
                  <p className="text-gray-400 text-sm">Each room represents a module</p>
                </div>
              </div>
              <p className="text-gray-300">
                Click on any room door to access different features. Admin rooms are only accessible to administrators.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-6 border border-green-700/30">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <FiUsers size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Quick Stats</h3>
                  <p className="text-gray-400 text-sm">Current status overview</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Members:</span>
                  <span className="font-semibold">{stats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-semibold">₹{stats.currentBalance}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Access:</span>
                  <span className={`font-semibold ${
                    user?.role === 'admin' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {user?.role === 'admin' ? 'Full Access' : 'Member Access'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 rounded-xl p-6 border border-indigo-700/30">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Admin Status</h3>
                  <p className="text-gray-400 text-sm">
                    {user?.role === 'admin' ? 'Full administrative access' : 'Limited access'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    user?.role === 'admin' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span>Access Level: {user?.role === 'admin' ? 'Administrator' : 'Member'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    user?.role === 'admin' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>Admin Rooms: {user?.role === 'admin' ? 'Accessible' : 'Locked'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#08100d]/95 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          {mobileQuickRooms.map((room) => (
            <button
              key={`dock-${room.id}`}
              onClick={() => handleRoomClick(room)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center text-emerald-50/80 transition hover:bg-white/5"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${room.color}`}>
                <room.icon size={18} />
              </div>
              <span className="truncate text-[11px] font-medium">{room.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomDashboard;
