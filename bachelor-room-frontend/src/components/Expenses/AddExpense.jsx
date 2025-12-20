import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from 'react-icons/fi';

const AddExpense = ({ currentUser, onExpenseAdded }) => {
  const [formData, setFormData] = useState({
    expense_date: new Date(),
    description: '',
    amount: '',
    created_by: currentUser?.id || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        expense_date: format(formData.expense_date, 'yyyy-MM-dd'),
      };
      
      await api.post('/expenses', payload);
      toast.success('Expense added successfully');
      
      setFormData({
        expense_date: new Date(),
        description: '',
        amount: '',
        created_by: currentUser?.id || '',
      });
      
      if (onExpenseAdded) onExpenseAdded();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <div className="relative">
            <DatePicker
              selected={formData.expense_date}
              onChange={(date) => setFormData({ ...formData, expense_date: date })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
              dateFormat="yyyy-MM-dd"
            />
            <FiCalendar className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            placeholder="What was this expense for?"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="input-field"
            placeholder="Enter amount"
            min="1"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
};

export default AddExpense;