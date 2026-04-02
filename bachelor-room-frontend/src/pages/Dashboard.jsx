import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiCreditCard, 
  FiTrendingDown,
  FiTrash2,
  FiPieChart,
  FiTrendingUp,
  FiCalendar,
  FiActivity,
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
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [expenses, setExpenses] = useState([]);
  const [reportContributions, setReportContributions] = useState([]);
  const [reportWallet, setReportWallet] = useState(null);
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

  useEffect(() => {
    fetchReportContributions();
    fetchReportWallet();
  }, [selectedDate, selectedMonth, viewMode]);

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
        const activityDate = contribution.paid_date || contribution.created_at;
        activities.push({
          id: `c-${contribution.id}`,
          user: contribution.user?.name || 'Unknown',
          action: 'Paid contribution',
          amount: parseFloat(contribution.amount) || 0,
          time: formatTime(activityDate),
          activityDate,
          type: 'credit'
        });
      });

      // Add expense activities
      recentExpenses.slice(0, 3).forEach(expense => {
        const activityDate = expense.expense_date || expense.created_at;
        activities.push({
          id: `e-${expense.id}`,
          user: expense.user?.name || 'Unknown',
          action: expense.description || 'Added expense',
          amount: parseFloat(expense.amount) || 0,
          time: formatTime(activityDate),
          activityDate,
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
            activityDate: recentUser.created_at,
            type: 'info'
          });
        }
      }

      // Sort activities by time (newest first)
      activities.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));

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

  const fetchReportContributions = async () => {
    try {
      const reportMonth = viewMode === 'daily'
        ? format(selectedDate, 'yyyy-MM')
        : selectedMonth;

      const response = await apiService.getContributionsByMonth(reportMonth);
      setReportContributions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch contribution report:', error);
      toast.error('Failed to load contribution report');
    }
  };

  const fetchReportWallet = async () => {
    try {
      const reportMonth = viewMode === 'daily'
        ? format(selectedDate, 'yyyy-MM')
        : selectedMonth;

      const response = await apiService.getWalletByMonth(reportMonth);
      setReportWallet(response.data || { total_collected: 0, total_spent: 0, balance: 0 });
    } catch (error) {
      console.error('Failed to fetch wallet report:', error);
      toast.error('Failed to load wallet report');
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
    const expenseAmount = parseFloat(newExpense.amount);
    
    if (!newExpense.description.trim() || !newExpense.amount) {
      toast.error('Please fill all fields');
      return;
    }

    if (stats.currentBalance <= 0) {
      toast.error('Expenses can only be added when the current balance is above zero.');
      return;
    }

    if (expenseAmount > stats.currentBalance) {
      toast.error('Expense amount cannot be greater than the current balance.');
      return;
    }

    try {
      await apiService.createExpense({
        ...newExpense,
        expense_date: newExpense.expense_date.toISOString().split('T')[0],
        amount: expenseAmount,
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
      icon: FiTrendingDown,
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

  const reportDate = selectedDate.toISOString().split('T')[0];
  const filteredContributions = reportContributions.filter((contribution) => {
    if (viewMode === 'daily') {
      const contributionDate = contribution.paid_date || contribution.created_at;
      return contributionDate?.startsWith(reportDate);
    }

    return true;
  });

  const reportContributionTotal = filteredContributions.reduce(
    (sum, contribution) => sum + parseFloat(contribution.amount || 0),
    0
  );
  const reportExpenseTotal = totalAmount;
  const reportNetTotal = reportContributionTotal - reportExpenseTotal;
  const reportBalance = parseFloat(reportWallet?.balance || 0);
  const filteredRecentActivities = recentActivities.filter((activity) => {
    const activityDate = new Date(activity.activityDate);
    const now = new Date();

    if (selectedPeriod === 'today') {
      return activityDate.toDateString() === now.toDateString();
    }

    if (selectedPeriod === 'weekly') {
      return activityDate >= subDays(now, 7);
    }

    if (selectedPeriod === 'monthly') {
      return format(activityDate, 'yyyy-MM') === format(now, 'yyyy-MM');
    }

    return true;
  });

 
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }


  return (
    <div className="app-page overflow-x-hidden">
      {/* Room Door Header */}
      <div className="app-hero relative min-h-[15rem] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="container-responsive flex min-h-[15rem] items-center justify-center py-12">
          <div className="text-center relative z-10">
            <h1 className="text-3xl font-bold mb-2">Main Hall Dashboard</h1>
            <p className="mx-auto max-w-md text-sm text-gray-300 sm:text-base">Welcome back, {user?.name}. Review activity, expenses, and the current room balance from one clean dashboard.</p>
          </div>
        </div>
        
        {/* Back Button */}
        <button
          onClick={handleBackToRoom}
          className="absolute left-4 top-4 flex items-center space-x-2 rounded-xl bg-black/30 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-black/40 sm:left-6 sm:top-6"
        >
          <FiArrowLeft />
          <span className="hidden sm:inline">Back to Rooms</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="container-responsive relative z-10 -mt-6 pb-10 pt-4 sm:-mt-8 sm:pt-6 mobile-safe-pad">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div 
              key={index}
              className="app-panel cursor-pointer transition-all duration-300 hover:-translate-y-1"
             
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
            <div className="app-panel">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Activities</h2>
                <div className="flex items-center space-x-3">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="today">Today</option>
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                  </select>
               
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredRecentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center rounded-2xl bg-black/20 p-4 transition-colors hover:bg-white/5">
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

                {filteredRecentActivities.length === 0 && (
                  <div className="rounded-2xl bg-black/20 p-6 text-center">
                    <FiActivity className="mx-auto mb-3 text-gray-500" size={28} />
                    <p className="text-sm text-gray-400">No activities found for this period.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="lg:col-span-2">
            <div className="app-panel overflow-hidden">
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
                
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
                  <div className="flex flex-wrap gap-2">
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
                          className="w-40 rounded-xl border border-white/10 bg-black/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          dateFormat="yyyy-MM-dd"
                        />
                        <FiCalendar className="absolute right-3 top-2.5 text-gray-400" />
                      </div>
                    ) : (
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="app-subtle p-4">
                  <p className="text-sm text-gray-400">
                    {viewMode === 'daily' ? 'Daily Contributions' : 'Monthly Contributions'}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-green-400">₹{reportContributionTotal.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {filteredContributions.length} payment{filteredContributions.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>

                <div className="app-subtle p-4">
                  <p className="text-sm text-gray-400">
                    {viewMode === 'daily' ? 'Daily Expenses' : 'Monthly Expenses'}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-400">₹{reportExpenseTotal.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>

                <div className="app-subtle p-4">
                  <p className="text-sm text-gray-400">Net Report</p>
                  <p className={`mt-2 text-2xl font-bold ${reportNetTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{reportNetTotal.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {reportNetTotal >= 0 ? 'Contributions are covering expenses.' : 'Expenses are higher than contributions.'}
                  </p>
                </div>

                <div className="app-subtle p-4">
                  <p className="text-sm text-gray-400">
                    {viewMode === 'daily' ? 'Month Balance' : 'Current Balance'}
                  </p>
                  <p className={`mt-2 text-2xl font-bold ${reportBalance >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    ₹{reportBalance.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Includes carry-forward balance for the selected month.
                  </p>
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
                    <FiTrendingDown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
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

            <div className="mt-6 app-panel overflow-hidden">
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  {viewMode === 'daily' ? 'Daily Contributions' : 'Monthly Contributions'}
                </h2>
                <p className="text-sm text-gray-400">
                  {viewMode === 'daily'
                    ? selectedDate.toLocaleDateString()
                    : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left font-medium text-gray-400">Member</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-400">Paid Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContributions.map((contribution) => (
                      <tr key={contribution.id} className="border-b border-gray-800 transition-colors hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-sm font-medium text-white">
                              {contribution.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{contribution.user?.name || 'Unknown'}</p>
                              <p className="truncate text-sm text-gray-400">{contribution.user?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            contribution.status === 'paid'
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-yellow-900/40 text-yellow-400'
                          }`}>
                            {contribution.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {contribution.paid_date
                            ? new Date(contribution.paid_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-green-400">
                            +₹{parseFloat(contribution.amount || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredContributions.length === 0 && (
                  <div className="py-12 text-center">
                    <FiCreditCard className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                    <p className="text-gray-400">No contributions found for this period</p>
                    <p className="mt-1 text-sm text-gray-500">Contribution entries will appear here once payments are recorded</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-700 pt-6">
                <div className="text-gray-400">
                  Showing {filteredContributions.length} contributions
                </div>
                <div className="text-lg font-bold text-green-400">
                  Total: +₹{reportContributionTotal.toLocaleString()}
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
