import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { 
  FiArrowLeft,
  FiUsers,
  FiDollarSign,
  FiCreditCard,
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiUserPlus,
  FiSettings,
  FiChevronRight,
  FiShield
} from 'react-icons/fi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingContributions: 0,
    totalExpenses: 0,
    currentBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, walletRes] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getCurrentWallet(),
      ]);
      
      setUsers(usersRes.data || []);
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const contributionsRes = await apiService.getContributionsByMonth(currentMonth);
      const paidCount = contributionsRes.data?.filter(c => c.status === 'paid').length || 0;
      
      setStats({
        totalMembers: usersRes.data?.length || 0,
        pendingContributions: (usersRes.data?.length || 0) - paidCount,
        totalExpenses: walletRes.data?.total_spent || 0,
        currentBalance: walletRes.data?.balance || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRoom = () => {
    const roomDoor = document.getElementById('admin-room-door');
    if (roomDoor) {
      roomDoor.style.transform = 'rotateY(-90deg)';
      roomDoor.style.transition = 'transform 0.5s ease';
      
      setTimeout(() => {
        navigate('/room');
      }, 300);
    } else {
      navigate('/room');
    }
  };

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: FiUsers,
      color: 'bg-blue-500',
      doorColor: 'bg-blue-700',
      path: '/admin/users',
      change: '+2 this month',
      changeUp: true
    },
    {
      title: 'Pending Contributions',
      value: stats.pendingContributions,
      icon: FiCreditCard,
      color: 'bg-yellow-500',
      doorColor: 'bg-yellow-700',
      path: '/contributions',
      change: 'Need attention',
      changeUp: false
    },
    {
      title: 'Monthly Expenses',
      value: `₹${stats.totalExpenses.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-red-500',
      doorColor: 'bg-red-700',
      path: '/expenses',
      change: '-5% from last month',
      changeUp: false
    },
    {
      title: 'Wallet Balance',
      value: `₹${stats.currentBalance.toLocaleString()}`,
      icon: FiPieChart,
      color: 'bg-purple-500',
      doorColor: 'bg-purple-700',
      path: '/wallet',
      change: stats.currentBalance > 0 ? 'Positive' : 'Negative',
      changeUp: stats.currentBalance > 0
    },
  ];

  const adminActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove members',
      icon: FiUserPlus,
      color: 'from-blue-900/30 to-blue-800/30',
      borderColor: 'border-blue-700/30',
      path: '/admin/users'
    },
    {
      title: 'View Reports',
      description: 'Financial reports and analytics',
      icon: FiActivity,
      color: 'from-green-900/30 to-green-800/30',
      borderColor: 'border-green-700/30',
      path: '/admin/reports'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: FiSettings,
      color: 'from-purple-900/30 to-purple-800/30',
      borderColor: 'border-purple-700/30',
      path: '/admin/settings'
    },
    {
      title: 'Audit Logs',
      description: 'View system activity logs',
      icon: FiShield,
      color: 'from-red-900/30 to-red-800/30',
      borderColor: 'border-red-700/30',
      path: '/admin/audit'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="loader w-12 h-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Admin Room Door Header */}
      <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-red-900/20"></div>
        <div className="container-responsive h-full flex items-center justify-center">
          <div className="text-center relative z-10">
         
            
            <h1 className="text-3xl font-bold mb-2">Admin Control Room</h1>
            <p className="text-gray-400">Welcome, Administrator {user?.name}</p>
          </div>
        </div>
        
        {/* Back Button */}
        <button
          onClick={handleBackToRoom}
          className="absolute top-6 left-6 flex items-center space-x-2 px-4 py-2 bg-gray-800/70 hover:bg-gray-700/70 rounded-lg backdrop-blur-sm transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Rooms</span>
        </button>
        
        {/* Admin Badge */}
        <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <FiShield />
            <span className="font-semibold">Administrator</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-responsive mt-3 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate(stat.path)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">{stat.title}</p>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <div className="flex items-center">
                    {stat.changeUp ? (
                      <FiTrendingUp className="text-green-500 mr-1" />
                    ) : (
                      <FiTrendingDown className="text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${stat.changeUp ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="text-white text-xl" />
                </div>
              </div>
              
            
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Members */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Members</h2>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                >
                  View All <FiChevronRight className="ml-1" />
                </button>
              </div>
              
              <div className="space-y-4">
                {users.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-medium mr-4">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium truncate">{member.name}</p>
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          member.role === 'admin' 
                            ? 'bg-red-900/50 text-red-400 border border-red-700/50' 
                            : 'bg-green-900/50 text-green-400 border border-green-700/50'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1 truncate">{member.email}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Joined: {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
              <h2 className="text-xl font-bold mb-6">Admin Actions</h2>
              <div className="space-y-4">
                {adminActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className={`w-full p-4 bg-gradient-to-br ${action.color} border ${action.borderColor} rounded-xl hover:opacity-90 transition-all duration-300 flex items-center`}
                  >
                    <div className="p-3 bg-white/10 rounded-lg mr-4">
                      <action.icon className="text-white text-xl" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-gray-400 text-sm mt-1">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;