import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiDollarSign, FiCreditCard, FiPieChart } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalContributions: 0,
    totalExpenses: 0,
    currentBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data from API
      // You'll need to create these endpoints in your backend
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const [walletRes, contributionsRes, expensesRes] = await Promise.all([
        api.get(`/wallet/${currentMonth}`),
        api.get(`/contributions/month/${currentMonth}`),
        api.get('/expenses/recent'),
      ]);
      
      setStats({
        totalContributions: walletRes.data.total_collected || 0,
        totalExpenses: walletRes.data.total_spent || 0,
        currentBalance: walletRes.data.balance || 0,
        totalMembers: contributionsRes.data?.length || 0,
      });
      
      setRecentActivities(expensesRes.data || []);
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
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Contributions',
      value: `$${stats.totalContributions.toLocaleString()}`,
      icon: FiCreditCard,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Expenses',
      value: `$${stats.totalExpenses.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
    {
      title: 'Current Balance',
      value: `$${stats.currentBalance.toLocaleString()}`,
      icon: FiPieChart,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className={`text-2xl font-bold mt-2 ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="text-white text-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(activity.expense_date).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-bold text-red-600">
                  -${activity.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-4">
            <button className="w-full btn-primary">
              Pay Contribution
            </button>
            <button className="w-full btn-secondary">
              Add Expense
            </button>
            <button className="w-full btn-secondary">
              View Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;