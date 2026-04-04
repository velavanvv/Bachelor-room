import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiCreditCard, 
  FiTrendingDown,
  FiPieChart,
  FiMessageSquare,
  FiLogOut,
  FiUser,
  FiChevronRight
} from 'react-icons/fi';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const adminRoomIds = ['admin-dashboard', 'contributions', 'users'];

const RoomDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [navbarOpen, setNavbarOpen] = useState(false);
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setNavbarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      icon: FiTrendingDown,
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
      id: 'live-chat',
      title: 'Live Chat Room',
      description: 'Talk with everyone in real time',
      icon: FiMessageSquare,
      color: 'from-emerald-500 to-teal-600',
      doorColor: 'bg-emerald-700',
      path: '/live-chat',
      stats: [
        { label: 'Status', value: 'Live' },
        { label: 'Room', value: 'Shared' },
      ],
      visible: true
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

  const isAdminRoom = (roomId) => adminRoomIds.includes(roomId);

  const handleRoomParallaxMove = (event) => {
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const rotateY = ((x / bounds.width) - 0.5) * 16;
    const rotateX = (0.5 - (y / bounds.height)) * 14;

    card.style.setProperty('--room-rotate-x', `${rotateX.toFixed(2)}deg`);
    card.style.setProperty('--room-rotate-y', `${rotateY.toFixed(2)}deg`);
    card.style.setProperty('--room-glow-x', `${((x / bounds.width) * 100).toFixed(2)}%`);
    card.style.setProperty('--room-glow-y', `${((y / bounds.height) * 100).toFixed(2)}%`);
  };

  const resetRoomParallax = (event) => {
    const card = event.currentTarget;
    card.style.setProperty('--room-rotate-x', '0deg');
    card.style.setProperty('--room-rotate-y', '0deg');
    card.style.setProperty('--room-glow-x', '50%');
    card.style.setProperty('--room-glow-y', '20%');
  };

  
  const handleRoomClick = (room) => {
    if (isAdminRoom(room.id) && user?.role !== 'admin') {
      toast.error('Admin access required for this room!');
      return;
    }

    setNavbarOpen(false);

    // Animate door opening
    const door = document.getElementById(`door-${room.id}`);
    if (door) {
      door.style.transform = 'rotateY(-90deg)';
      door.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';
      
      // Navigate after animation
      setTimeout(() => {
        navigate(room.path);
      }, 340);
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
    <div className="dashboard-fade-in min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,215,96,0.16),_transparent_26%),linear-gradient(180deg,_#07110d_0%,_#0f1915_38%,_#050706_100%)] text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 border-b border-white/8 bg-black/30 backdrop-blur-xl transition-colors duration-300">
        <div className="container-responsive py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3 sm:justify-start sm:space-x-4">
              <div className="min-w-0 flex-1 sm:flex-none">
                <h1 className="truncate text-lg font-bold sm:text-2xl">Bachelor Room</h1>
                <p className="text-xs text-gray-400 sm:text-sm">Management System</p>
              </div>
              <button
                type="button"
                aria-label={navbarOpen ? 'Hide user menu' : 'Show user menu'}
                aria-expanded={navbarOpen}
                onClick={() => setNavbarOpen(!navbarOpen)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 sm:hidden ${
                user?.role === 'admin'
                  ? 'bg-gradient-to-r from-red-600 to-red-700'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700'
              }`}
              >
                <FiUser size={18} />
              </button>
            </div>
            
            <div
              className={`overflow-hidden transition-all duration-300 ease-out sm:overflow-visible ${
                navbarOpen
                  ? 'max-h-40 translate-y-0 opacity-100'
                  : 'max-h-0 -translate-y-2 opacity-0 sm:max-h-none sm:translate-y-0 sm:opacity-100'
              }`}
            >
              <div className="flex min-w-0 flex-col items-stretch gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
              <div className="min-w-0 pr-2 sm:hidden">
                <p className="truncate break-words text-sm font-medium leading-5">{user?.name}</p>
                <p className="truncate text-xs text-gray-400">{user?.role?.toUpperCase()}</p>
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
                className="flex items-center justify-center space-x-2 rounded-xl bg-red-600 px-3 py-2 text-sm transition-all duration-300 hover:scale-[1.02] hover:bg-red-700 active:scale-[0.98] sm:px-4"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Main Content - Room Layout */}
        <div className="overflow-x-hidden p-4 pb-10 md:p-6 md:pb-6">
          <div className="dashboard-stagger mb-6 md:mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to Your Room!</h1>
            <p className="text-gray-400">
              {user?.role === 'admin' 
                ? 'As an admin, you have access to all rooms including Admin Control.'
                : 'Click on any room door to access different features.'
              }
            </p>
          </div>

          <div className="mb-8 md:hidden">
            <div className="dashboard-stagger overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(30,215,96,0.26),_rgba(10,10,10,0.1)_45%,_rgba(0,0,0,0.45)_100%)] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.35)]">
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/70">Room Snapshot</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold leading-tight">Your room at a glance.</h2>
                  <p className="mt-2 text-sm text-emerald-50/70">
                    Check contributions, expenses, and wallet stats in one clean view.
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

            <div className="dashboard-stagger mt-4 rounded-[1.75rem] border border-white/10 bg-[#08100d]/90 p-3 backdrop-blur-xl">
              <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
                {visibleRooms.map((room) => (
                  <button
                    key={`mobile-inline-${room.id}`}
                    onClick={() => handleRoomClick(room)}
                    className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center text-emerald-50/80 transition-all duration-300 hover:-translate-y-1 hover:bg-white/5 active:translate-y-0"
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

          {/* Room Grid */}
          <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
            {visibleRooms.map((room, index) => (
              <div
                key={room.id}
                style={{ animationDelay: `${index * 90}ms` }}
                onMouseMove={handleRoomParallaxMove}
                onMouseLeave={resetRoomParallax}
                className={`room-parallax-card dashboard-stagger relative rounded-[1.75rem] p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_65px_rgba(0,0,0,0.42)] ${
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
                <div className="room-parallax-glow"></div>
                <div className="room-shell">
                  <div className="room-shell-ceiling"></div>
                  <div className="room-shell-wall room-shell-wall-left"></div>
                  <div className="room-shell-wall room-shell-wall-right"></div>
                  <div className="room-shell-back"></div>
                  <div className="room-shell-floor"></div>
                </div>
                
                {/* Room Content */}
                <div className="relative z-10">
                  {/* Door Frame */}
                  <div className="relative mb-6">
                    <div className="room-door-frame flex h-64 w-full items-center justify-center overflow-hidden rounded-[1.4rem] border-4 border-white/10">
                      <div className="room-door-light"></div>
                      <div className="room-door-cast-shadow"></div>
                      {/* Door */}
                      <div
                        id={`door-${room.id}`}
                        className={`room-door-panel w-48 h-56 ${room.doorColor} rounded-lg border-4 ${room.doorColor.replace('bg-', 'border-')} relative flex cursor-pointer flex-col items-center justify-center transform transition-transform duration-500 ease-out hover:scale-[1.03] ${
                          isAdminRoom(room.id) ? 'room-door' : ''
                        }`}
                        onClick={() => handleRoomClick(room)}
                      >
                        <div className="room-door-depth"></div>
                        <div className="room-door-shine"></div>
                        <div className="room-door-top-panel"></div>
                        <div className="room-door-bottom-panel"></div>
                        <div className="room-door-rail room-door-rail-top"></div>
                        <div className="room-door-rail room-door-rail-mid"></div>
                        <div className="room-door-rail room-door-rail-bottom"></div>
                        <div className="room-door-knob-plate"></div>
                        {/* Admin Icon */}
                        {isAdminRoom(room.id) && (
                          <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Door Knob */}
                        <div className="absolute right-6 top-1/2 z-10 h-6 w-6 -translate-y-1/2 transform rounded-full bg-yellow-400"></div>
                        
                        {/* Door Content */}
                        <room.icon className="relative z-10 mb-3 text-4xl text-white" />
                        <span className="relative z-10 text-lg font-semibold text-white">{room.title}</span>
                        
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
                      className={`mt-6 flex w-full items-center justify-center rounded-lg py-3 font-medium transition-all duration-300 hover:-translate-y-0.5 ${
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

    </div>
  );
};

export default RoomDashboard;
