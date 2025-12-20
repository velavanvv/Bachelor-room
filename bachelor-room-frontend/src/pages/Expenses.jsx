import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AddExpense from '../components/Expenses/AddExpense';
import { useAuth } from '../context/AuthContext';
import { FiTrash2, FiEdit, FiCalendar, FiDollarSign } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import toast from 'react-hot-toast';
const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [selectedDate, viewMode, selectedMonth, expenses]);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
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

  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
          <p className="text-gray-600">Track and manage all expenses</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md ${viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-md ${viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {viewMode === 'daily' ? 'Daily Expenses' : 'Monthly Expenses'}
              </h3>
              
              <div className="flex items-center space-x-4">
                {viewMode === 'daily' ? (
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="text-gray-500" />
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      className="px-3 py-1 border rounded-md"
                      dateFormat="yyyy-MM-dd"
                    />
                  </div>
                ) : (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1 border rounded-md"
                  />
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <FiDollarSign className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No expenses found for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Added By</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{expense.description}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium mr-2">
                              {expense.user?.name?.charAt(0) || 'U'}
                            </div>
                            {expense.user?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-red-600">
                            -${parseFloat(expense.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {(user.id === expense.created_by || user.role === 'admin') && (
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="flex justify-between items-center mt-6 pt-6 border-t">
                  <div className="text-gray-600">
                    Showing {filteredExpenses.length} expenses
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    Total: -${totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <AddExpense 
            currentUser={user} 
            onExpenseAdded={fetchExpenses}
          />
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Expense Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <div>
                  <p className="text-sm text-gray-600">Today's Expenses</p>
                  <p className="text-xl font-bold text-red-600">
                    -${expenses
                      .filter(e => e.expense_date === new Date().toISOString().split('T')[0])
                      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <FiCalendar className="text-blue-600 text-2xl" />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <div>
                  <p className="text-sm text-gray-600">This Month's Expenses</p>
                  <p className="text-xl font-bold text-red-600">
                    -${expenses
                      .filter(e => e.expense_date.startsWith(new Date().toISOString().slice(0, 7)))
                      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <FiDollarSign className="text-green-600 text-2xl" />
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Quick Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Daily:</span>
                    <span className="font-medium">
                      ${(totalAmount / 30).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Highest Expense:</span>
                    <span className="font-medium">
                      ${filteredExpenses.length > 0 
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
  );
};

export default Expenses;