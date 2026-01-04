import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiCreditCard, 
  FiDollarSign, 
  FiFileText,
  FiUser,
  FiTrash2,
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiActivity,
  FiRefreshCw,
  FiArrowLeft,
  FiChevronRight
} from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import { apiService } from '../services/api';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State declarations
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalContributions: 0,
    totalExpenses: 0,
    currentBalance: 0,
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date(),
    description: '',
    amount: '',
    created_by: user?.id || '',
  });

  // Fetch initial data
  useEffect(() => {
    fetchDashboardData();
    fetchExpenses();
  }, []);

  // Filter expenses when dependencies change
  useEffect(() => {
    filterExpenses();
  }, [selectedDate, viewMode, selectedMonth, expenses]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, walletRes, expensesRes, contributionsRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getCurrentWallet(),
        apiService.getRecentExpenses(),
        apiService.getContributionsByMonth(format(new Date(), 'yyyy-MM'))
      ]);

      const users = usersRes.data || [];
      const wallet = walletRes.data || { total_collected: 0, total_spent: 0, balance: 0 };
      const recentExpenses = expensesRes.data || [];
      const contributions = contributionsRes.data || [];

      // Calculate stats
      const totalMembers = users.length;
      const totalContributions = parseFloat(wallet.total_collected) || 0;
      const totalExpenses = parseFloat(wallet.total_spent) || 0;
      const currentBalance = parseFloat(wallet.balance) || 0;

      // Prepare recent activities
      const activities = [];

      // Add contribution activities
      contributions.slice(0, 3).forEach(contribution => {
        activities.push({
          id: `c-${contribution.id}`,
          user: contribution.user?.name || 'Unknown',
          action: 'Paid contribution',
          amount: parseFloat(contribution.amount) || 0,
          time: formatTime(contribution.paid_date || contribution.created_at),
          type: 'credit'
        });
      });

      // Add expense activities
      recentExpenses.slice(0, 3).forEach(expense => {
        activities.push({
          id: `e-${expense.id}`,
          user: expense.user?.name || 'Unknown',
          action: expense.description || 'Added expense',
          amount: parseFloat(expense.amount) || 0,
          time: formatTime(expense.expense_date || expense.created_at),
          type: 'debit'
        });
      });

      // Add new member activity for admin
      if (user?.role === 'admin') {
        const recentUser = users.find(u => 
          new Date(u.created_at) > subDays(new Date(), 7)
        );
        if (recentUser) {
          activities.push({
            id: `u-${recentUser.id}`,
            user: 'Admin',
            action: `Added ${recentUser.name} as member`,
            amount: null,
            time: formatTime(recentUser.created_at),
            type: 'info'
          });
        }
      }

      // Sort activities by time (newest first)
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));

      // Update state
      setStats({
        totalMembers,
        totalContributions,
        totalExpenses,
        currentBalance,
      });

      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await apiService.getExpenses();
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses');
    }
  };

  const filterExpenses = () => {
    let filtered = [];
    
    if (viewMode === 'daily') {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filtered = expenses.filter(expense => 
        expense.expense_date === dateStr
      );
    } else {
      filtered = expenses.filter(expense => 
        expense.expense_date.startsWith(selectedMonth)
      );
    }
    
    setFilteredExpenses(filtered);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.description.trim() || !newExpense.amount) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await apiService.createExpense({
        ...newExpense,
        expense_date: newExpense.expense_date.toISOString().split('T')[0],
        amount: parseFloat(newExpense.amount),
      });
      
      toast.success('Expense added successfully');
      setNewExpense({
        expense_date: new Date(),
        description: '',
        amount: '',
        created_by: user?.id || '',
      });
      
      // Refresh both expenses and dashboard data
      await Promise.all([fetchExpenses(), fetchDashboardData()]);
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await apiService.deleteExpense(id);
      toast.success('Expense deleted successfully');
      await Promise.all([fetchExpenses(), fetchDashboardData()]);
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now - date;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
      } else {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return 'Recently';
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleBackToRoom = () => {
    const roomDoor = document.getElementById('room-door');
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
    },
    {
      title: 'Total Contributions',
      value: `₹${stats.totalContributions.toLocaleString()}`,
      icon: FiCreditCard,
      color: 'bg-green-500',
      doorColor: 'bg-green-700',
    },
    {
      title: 'Total Expenses',
      value: `₹${stats.totalExpenses.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-red-500',
      doorColor: 'bg-red-700',
    },
    {
      title: 'Current Balance',
      value: `₹${stats.currentBalance.toLocaleString()}`,
      icon: FiPieChart,
      color: 'bg-purple-500',
      doorColor: 'bg-purple-700',
    },
  ];

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => 
    sum + parseFloat(expense.amount || 0), 0
  );
  
  const monthlyTotal = expenses
    .filter(e => e.expense_date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

 
  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Room Door Header */}
      <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="container-responsive h-full flex items-center justify-center">
          <div className="text-center relative z-10">
          
            
            <h1 className="text-3xl font-bold mb-2">Main Hall Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.name}! Here's your overview.</p>
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
        
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="absolute top-6 right-6 flex items-center space-x-2 px-4 py-2 bg-blue-600/70 hover:bg-blue-700/70 rounded-lg backdrop-blur-sm transition-colors"
        >
          <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="container-responsive mt-13 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
             
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">{stat.title}</p>
                  <p className="text-2xl font-bold mb-3">{stat.value}</p>
               
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
          {/* Recent Activities */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Activities</h2>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <option value="today">Today</option>
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                  </select>
               
                </div>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      activity.type === 'credit' ? 'bg-green-900/50 border border-green-700' : 
                      activity.type === 'debit' ? 'bg-red-900/50 border border-red-700' : 
                      'bg-blue-900/50 border border-blue-700'
                    }`}>
                      {activity.type === 'credit' ? (
                        <FiTrendingUp className="text-green-400" />
                      ) : activity.type === 'debit' ? (
                        <FiTrendingDown className="text-red-400" />
                      ) : (
                        <FiUsers className="text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium truncate">{activity.user}</p>
                        {activity.amount && (
                          <span className={`text-sm font-semibold ${
                            activity.type === 'credit' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {activity.type === 'credit' ? '+' : '-'}₹{activity.amount}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{activity.action}</p>
                      <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {viewMode === 'daily' ? 'Daily Expenses' : 'Monthly Expenses'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {viewMode === 'daily' 
                      ? selectedDate.toLocaleDateString()
                      : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('daily')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        viewMode === 'daily' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setViewMode('monthly')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        viewMode === 'monthly' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {viewMode === 'daily' ? (
                      <div className="relative">
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date) => setSelectedDate(date)}
                          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-40"
                          dateFormat="yyyy-MM-dd"
                        />
                        <FiCalendar className="absolute right-3 top-2.5 text-gray-400" />
                      </div>
                    ) : (
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    )}
                    <button
                      onClick={fetchExpenses}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <FiRefreshCw />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Added By</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="text-gray-300">
                            {new Date(expense.expense_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            {expense.category && (
                              <p className="text-sm text-gray-400">{expense.category}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center text-white font-medium mr-2">
                              {expense.user?.name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-gray-300">{expense.user?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-red-400">
                            -₹{parseFloat(expense.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {(user.id === expense.created_by || user.role === 'admin') && (
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredExpenses.length === 0 && (
                  <div className="text-center py-12">
                    <FiDollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No expenses found for this period</p>
                    <p className="text-gray-500 text-sm mt-1">Add your first expense to get started</p>
                  </div>
                )}
              </div>

              {/* Summary Footer */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">
                    Showing {filteredExpenses.length} expenses
                  </div>
                  <div className="text-lg font-bold text-red-400">
                    Total: -₹{totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center mr-4">
                    <FiFileText className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Top Category</h3>
                    <p className="text-sm text-gray-400">Most common expense</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">Rent</p>
                  <p className="text-sm text-gray-400 mt-1">Monthly payment</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                    <FiTrendingUp className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Expense Trend</h3>
                    <p className="text-sm text-gray-400">Monthly comparison</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">-12%</p>
                  <p className="text-sm text-gray-400 mt-1">From last month</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-900/30 rounded-full flex items-center justify-center mr-4">
                    <FiUser className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Top Spender</h3>
                    <p className="text-sm text-gray-400">Most expenses added</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-400 truncate">John Doe</p>
                  <p className="text-sm text-gray-400 mt-1">Admin</p>
                </div>
              </div>
            </div>
          </div>
         
        </div>
      </div>
    </div>
  );
};

export default Dashboard;