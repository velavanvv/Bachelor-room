import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Payment = ({ users, currentMonth, onPaymentSuccess }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    month: currentMonth || format(new Date(), 'yyyy-MM'),
    amount: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/contributions/pay', formData);
      toast.success('Payment recorded successfully');
      setFormData({
        ...formData,
        user_id: '',
        amount: '',
      });
      
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Member
          </label>
          <select
            value={formData.user_id}
            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Choose a member</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>
          <input
            type="month"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            className="input-field"
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
          {loading ? 'Processing...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
};

export default Payment;