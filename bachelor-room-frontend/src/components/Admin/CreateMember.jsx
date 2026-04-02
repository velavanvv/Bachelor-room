import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateMember = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/create-member', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      toast.success('Member created successfully');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-white">Add New Member</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
            minLength="6"
          />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
            minLength="6"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create Member'}
        </button>
      </form>
    </div>
  );
};

export default CreateMember;
