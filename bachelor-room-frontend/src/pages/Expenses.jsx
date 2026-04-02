import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { 
  FiArrowLeft,
  FiCalendar,
  FiTrash2,
  FiTrendingUp,
  FiPlus
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';

const Expenses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [viewMode, setViewMode] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date(),
    description: '',
    amount: '',
    created_by: user?.id || '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [selectedDate, viewMode, selectedMonth, expenses]);

  const fetchExpenses = async () => {
    try {
      const [expensesResponse, walletResponse] = await Promise.all([
        apiService.getExpenses(),
        apiService.getCurrentWallet(),
      ]);
      setExpenses(expensesResponse.data || []);
      setCurrentBalance(parseFloat(walletResponse.data?.balance) || 0);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    if (viewMode === 'daily') {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const filtered = expenses.filter(expense => 
        expense.expense_date === dateStr
      );
      setFilteredExpenses(filtered);
    } else {
      const filtered = expenses.filter(expense => 
        expense.expense_date.startsWith(selectedMonth)
      );
      setFilteredExpenses(filtered);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const expenseAmount = parseFloat(newExpense.amount);
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Please fill all fields');
      return;
    }

    if (currentBalance <= 0) {
      toast.error('Expenses can only be added when the current balance is above zero.');
      return;
    }

    if (expenseAmount > currentBalance) {
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
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await apiService.deleteExpense(id);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleBackToRoom = () => {
    const roomDoor = document.getElementById('expenses-room-door');
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

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const monthlyTotal = expenses
    .filter(e => e.expense_date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="loader w-12 h-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="app-page overflow-x-hidden">
      {/* Room Door Header */}
      <div className="app-hero relative min-h-[15rem] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-pink-900/20"></div>
        <div className="container-responsive flex min-h-[15rem] items-center justify-center py-12">
          <div className="text-center relative z-10">
            <h1 className="text-3xl font-bold mb-2">Expense Management</h1>
            <p className="mx-auto max-w-md text-sm text-gray-300 sm:text-base">Track daily spending, add expenses quickly, and review totals in the same clean layout as the rest of the dashboard.</p>
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
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Add Expense Form */}
          <div className="lg:col-span-2">
            <div className="app-panel">
              <h2 className="text-xl font-bold mb-6">Add New Expense</h2>
              {currentBalance <= 0 && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  Current balance is zero or below. Add contributions before creating a new expense.
                </div>
              )}
              {currentBalance > 0 && (
                <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Available balance: ₹{currentBalance.toLocaleString()}
                </div>
              )}
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <div className="relative">
                    <DatePicker
                      selected={newExpense.expense_date}
                      onChange={(date) => setNewExpense({ ...newExpense, expense_date: date })}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      dateFormat="yyyy-MM-dd"
                    />
                    <FiCalendar className="absolute right-3 top-2.5 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="What was this expense for?"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter amount"
                    min="1"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={currentBalance <= 0}
                  className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3 font-medium transition-all duration-300 hover:from-red-700 hover:to-pink-700"
                >
                  <FiPlus className="mr-2" />
                  {currentBalance <= 0 ? 'Balance Too Low' : 'Add Expense'}
                </button>
              </form>

              {/* Expense Summary */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="font-semibold mb-4">Expense Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-red-900/20 p-3">
                    <div>
                      <p className="text-sm text-gray-400">Today's Expenses</p>
                      <p className="text-xl font-bold text-red-400">
                        ₹{expenses
                          .filter(e => e.expense_date === new Date().toISOString().split('T')[0])
                          .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <FiCalendar className="text-red-400 text-2xl" />
                  </div>
                  
                  <div className="flex items-center justify-between rounded-2xl bg-pink-900/20 p-3">
                    <div>
                      <p className="text-sm text-gray-400">This Month's Expenses</p>
                      <p className="text-xl font-bold text-pink-400">
                        ₹{monthlyTotal.toLocaleString()}
                      </p>
                    </div>
                    <FiTrendingUp className="text-pink-400 text-2xl" />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Average Daily:</span>
                      <span className="font-medium">₹{(totalAmount / 30).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Highest Expense:</span>
                      <span className="font-medium">
                        ₹{filteredExpenses.length > 0 
                          ? Math.max(...filteredExpenses.map(e => parseFloat(e.amount))).toLocaleString()
                          : '0'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Expenses;
