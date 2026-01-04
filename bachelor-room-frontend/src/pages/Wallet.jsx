import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { 
  FiArrowLeft,
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCreditCard,
  FiCalendar,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { format, subMonths, addMonths } from 'date-fns';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [walletData, setWalletData] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, [selectedMonth]);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [walletRes, expensesRes] = await Promise.all([
        apiService.getWalletByMonth(selectedMonth),
        apiService.getExpensesByMonth(selectedMonth),
      ]);
      
      setWalletData(walletRes.data);
      
      const categoryMap = {};
      expensesRes.data?.forEach(expense => {
        const category = expense.category || 'Other';
        categoryMap[category] = (categoryMap[category] || 0) + expense.amount;
      });
      
      const chartData = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
      }));
      
      setExpensesByCategory(chartData);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const current = new Date(selectedMonth + '-01');
    const newDate = direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
    setSelectedMonth(format(newDate, 'yyyy-MM'));
  };

  const handleBackToRoom = () => {
    const roomDoor = document.getElementById('wallet-room-door');
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="loader w-12 h-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Room Door Header */}
      <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-violet-900/20"></div>
        <div className="container-responsive h-full flex items-center justify-center">
          <div className="text-center relative z-10">
           
            
            <h1 className="text-3xl font-bold mb-2">Financial Overview</h1>
            <p className="text-gray-400">Wallet analytics and financial insights</p>
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
        
        {/* Month Navigation */}
        <div className="absolute top-6 right-6 flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 bg-gray-800/70 hover:bg-gray-700/70 rounded-lg backdrop-blur-sm transition-colors"
          >
            <FiChevronLeft />
          </button>
          <div className="px-4 py-2 bg-gray-800/70 rounded-lg backdrop-blur-sm">
            <span className="font-medium">
              {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
            </span>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 bg-gray-800/70 hover:bg-gray-700/70 rounded-lg backdrop-blur-sm transition-colors"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-responsive mt-13 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Collected</p>
                <p className="text-3xl font-bold mt-2 text-green-400">
                  ₹{walletData?.total_collected?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Monthly contributions</p>
              </div>
              <div className="bg-green-900/30 p-3 rounded-full border border-green-700/30">
                <FiTrendingUp className="text-green-400 text-2xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-3xl font-bold mt-2 text-red-400">
                  ₹{walletData?.total_spent?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Monthly expenses</p>
              </div>
              <div className="bg-red-900/30 p-3 rounded-full border border-red-700/30">
                <FiTrendingDown className="text-red-400 text-2xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Current Balance</p>
                <p className={`text-3xl font-bold mt-2 ${
                  (walletData?.balance || 0) >= 0 ? 'text-blue-400' : 'text-red-400'
                }`}>
                  ₹{walletData?.balance?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Remaining amount</p>
              </div>
              <div className={`p-3 rounded-full border ${
                (walletData?.balance || 0) >= 0 
                  ? 'bg-blue-900/30 border-blue-700/30' 
                  : 'bg-red-900/30 border-red-700/30'
              }`}>
                <FiPieChart className={`text-2xl ${
                  (walletData?.balance || 0) >= 0 ? 'text-blue-400' : 'text-red-400'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expense Distribution */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Expense Distribution</h2>
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ₹${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <FiPieChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No expense data available</p>
                <p className="text-gray-500 text-sm mt-1">Expenses will appear here as they're added</p>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Financial Summary</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Collection Rate</span>
                  <span className="text-sm font-medium">
                    {((walletData?.total_collected || 0) / 5000 * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, ((walletData?.total_collected || 0) / 5000 * 100))}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Expense Rate</span>
                  <span className="text-sm font-medium">
                    {((walletData?.total_spent || 0) / (walletData?.total_collected || 1) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, ((walletData?.total_spent || 0) / (walletData?.total_collected || 1) * 100))}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <h4 className="font-semibold mb-3">Financial Health</h4>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm mb-3 ${
                  (walletData?.balance || 0) > 0
                    ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                    : 'bg-red-900/30 text-red-400 border border-red-700/50'
                }`}>
                  {(walletData?.balance || 0) > 0 ? 'Healthy' : 'Deficit'}
                </div>
                <p className="text-gray-400 text-sm">
                  {(walletData?.balance || 0) > 0
                    ? 'Wallet has positive balance. Good financial management.'
                    : 'Expenses exceed collections. Review spending.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Monthly Trends</h2>
            <button
              onClick={fetchWalletData}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FiRefreshCw />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                  <FiCreditCard className="text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">Average Contribution</p>
                  <p className="text-sm text-gray-400">Per member</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-400">₹1,250</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center mr-4">
                  <FiTrendingUp className="text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">Growth Rate</p>
                  <p className="text-sm text-gray-400">Monthly increase</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-400">+15%</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-yellow-900/30 rounded-full flex items-center justify-center mr-4">
                  <FiCalendar className="text-yellow-400" />
                </div>
                <div>
                  <p className="font-semibold">Savings Target</p>
                  <p className="text-sm text-gray-400">This month</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-400">₹2,500</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;