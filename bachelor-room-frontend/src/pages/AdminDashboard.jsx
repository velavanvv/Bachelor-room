import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CreateMember from '../components/Admin/CreateMember';
import { FiUserPlus, FiDollarSign, FiTrendingUp, FiUsers, FiCreditCard, FiPieChart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingContributions: 0,
    totalExpenses: 0,
    currentBalance: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, walletRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/wallet/current'),
      ]);
      
      setUsers(usersRes.data || []);
      
      // Calculate statistics
      const currentMonth = new Date().toISOString().slice(0, 7);
      const contributionsRes = await api.get(`/contributions/month/${currentMonth}`);
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

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: FiUsers,
      color: 'bg-blue-500',
      change: '+2 this month',
    },
    {
      title: 'Pending Contributions',
      value: stats.pendingContributions,
      icon: FiCreditCard,
      color: 'bg-yellow-500',
      change: 'Need attention',
    },
    {
      title: 'Monthly Expenses',
      value: `$${stats.totalExpenses.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-red-500',
      change: '-5% from last month',
    },
    {
      title: 'Wallet Balance',
      value: `$${stats.currentBalance.toLocaleString()}`,
      icon: FiPieChart,
      color: 'bg-green-500',
      change: stats.currentBalance > 0 ? 'Positive' : 'Negative',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-gray-600">Welcome back, {user?.name}. Manage your bachelor room system.</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="text-white text-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Members</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Member</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Joined Date</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 5).map((member) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium mr-3">
                            {member.name.charAt(0)}
                          </div>
                          {member.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">{member.email}</td>
                      <td className="py-3 px-4">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <CreateMember onSuccess={fetchDashboardData} />
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center btn-primary">
                <FiUserPlus className="mr-2" />
                Add New Member
              </button>
              <button className="w-full flex items-center justify-center btn-secondary">
                <FiDollarSign className="mr-2" />
                Generate Financial Report
              </button>
              <button className="w-full flex items-center justify-center btn-secondary">
                <FiTrendingUp className="mr-2" />
                View Analytics
              </button>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Backend API</span>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database</span>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Sessions</span>
                <span className="font-medium">{users.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;