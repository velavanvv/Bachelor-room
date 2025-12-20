import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { format, subMonths, addMonths } from 'date-fns';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const Wallet = () => {
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
        api.get(`/wallet/${selectedMonth}`),
        api.get(`/expenses/month/${selectedMonth}`),
      ]);
      
      setWalletData(walletRes.data);
      
      // Process expenses by category
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
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const current = new Date(selectedMonth + '-01');
    const newDate = direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
    setSelectedMonth(format(newDate, 'yyyy-MM'));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Wallet</h2>
          <p className="text-gray-600">Financial overview and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiArrowLeft />
          </button>
          <span className="text-lg font-medium">
            {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiArrowRight />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Total Collected</h3>
              <p className="text-3xl font-bold text-green-600">
                ${walletData?.total_collected?.toLocaleString() || '0'}
              </p>
              <p className="text-gray-600 text-sm mt-2">Monthly contributions</p>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Total Spent</h3>
              <p className="text-3xl font-bold text-red-600">
                ${walletData?.total_spent?.toLocaleString() || '0'}
              </p>
              <p className="text-gray-600 text-sm mt-2">Monthly expenses</p>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Balance</h3>
              <p className={`text-3xl font-bold ${
                (walletData?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                ${walletData?.balance?.toLocaleString() || '0'}
              </p>
              <p className="text-gray-600 text-sm mt-2">Remaining amount</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Expense Distribution</h3>
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: $${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No expense data available
                </div>
              )}
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Collection Rate</span>
                    <span className="text-sm font-medium">
                      {((walletData?.total_collected || 0) / 5000 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${((walletData?.total_collected || 0) / 5000 * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Expense Rate</span>
                    <span className="text-sm font-medium">
                      {((walletData?.total_spent || 0) / (walletData?.total_collected || 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: `${((walletData?.total_spent || 0) / (walletData?.total_collected || 1) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Financial Health</h4>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    (walletData?.balance || 0) > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(walletData?.balance || 0) > 0 ? 'Healthy' : 'Deficit'}
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    {walletData?.balance > 0
                      ? 'Wallet has positive balance. Good financial management.'
                      : 'Expenses exceed collections. Review spending.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Wallet;