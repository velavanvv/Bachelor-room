import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { 
  FiArrowLeft,
  FiCreditCard,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiChevronRight
} from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Contributions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState({
    user_id: '',
    month: format(new Date(), 'yyyy-MM'),
    amount: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      const [contributionsRes, usersRes] = await Promise.all([
        apiService.getContributionsByMonth(selectedMonth),
        apiService.getUsers(),
      ]);
      
      setContributions(contributionsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!paymentData.user_id || !paymentData.amount) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await apiService.payContribution(paymentData);
      toast.success('Payment recorded successfully');
      setPaymentData({
        user_id: '',
        month: format(new Date(), 'yyyy-MM'),
        amount: '',
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  const handleBackToRoom = () => {
    const roomDoor = document.getElementById('contributions-room-door');
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

  const exportContributions = () => {
    if (contributions.length === 0) {
      toast.error('No contributions available to export');
      return;
    }

    const rows = [
      ['Member', 'Email', 'Amount', 'Status', 'Paid Date'],
      ...contributions.map((contribution) => [
        contribution.user?.name || 'Unknown',
        contribution.user?.email || '',
        contribution.amount || 0,
        contribution.status || 'pending',
        contribution.paid_date ? new Date(contribution.paid_date).toLocaleDateString() : '',
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contributions-${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Contribution export started');
  };

  const totalAmount = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const paidCount = contributions.filter(c => c.status === 'paid').length;
  const pendingCount = users.length - paidCount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="loader w-12 h-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="app-page">
      {/* Room Door Header */}
      <div className="app-hero relative min-h-[15rem] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-emerald-900/20"></div>
        <div className="container-responsive flex min-h-[15rem] items-center justify-center py-12">
          <div className="text-center relative z-10">
            <h1 className="text-3xl font-bold mb-2">Contributions Management</h1>
            <p className="mx-auto max-w-md text-sm text-gray-300 sm:text-base">Record member payments faster, check what is pending, and review the month from a layout that behaves better on phones.</p>
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
        
        {/* Export Button */}
        <button
          onClick={exportContributions}
          className="absolute right-4 top-4 flex items-center space-x-2 rounded-xl bg-green-600 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-green-700 sm:right-6 sm:top-6"
        >
          <FiDownload />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="container-responsive relative z-10 -mt-6 pb-10 pt-4 sm:-mt-8 sm:pt-6 mobile-safe-pad">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Payment Form */}
          <div className="lg:col-span-1">
            <div className="app-panel">
              <h2 className="text-xl font-bold mb-6">Record Payment</h2>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Select Member</label>
                  <select
                    value={paymentData.user_id}
                    onChange={(e) => setPaymentData({ ...paymentData, user_id: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-400 mb-1">Month</label>
                  <input
                    type="month"
                    value={paymentData.month}
                    onChange={(e) => setPaymentData({ ...paymentData, month: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter amount"
                    min="1"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 font-medium transition-all duration-300 hover:from-green-700 hover:to-emerald-700"
                >
                  Record Payment
                </button>
              </form>

              {/* Quick Stats */}
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Collected:</span>
                    <span className="font-bold text-green-400">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paid Members:</span>
                    <span className="font-bold">{paidCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pending Members:</span>
                    <span className="font-bold text-yellow-400">{pendingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Rate:</span>
                    <span className="font-bold">
                      {users.length > 0 ? Math.round((paidCount / users.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contributions List */}
          <div className="lg:col-span-2">
            <div className="app-panel">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold">Payment History</h2>
                  <p className="text-gray-400 text-sm">
                    {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={fetchData}
                    className="rounded-2xl bg-black/20 p-3 transition-colors hover:bg-black/30"
                  >
                    <FiRefreshCw />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Member</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((contribution) => (
                      <tr key={contribution.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                              {contribution.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-medium">{contribution.user?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-400">{contribution.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <FiDollarSign className="text-gray-400 mr-1" />
                            <span className="font-bold">₹{contribution.amount}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {contribution.status === 'paid' ? (
                            <span className="flex items-center text-green-400">
                              <FiCheckCircle className="mr-1" />
                              Paid
                            </span>
                          ) : (
                            <span className="flex items-center text-red-400">
                              <FiXCircle className="mr-1" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {contribution.paid_date 
                            ? new Date(contribution.paid_date).toLocaleDateString()
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {contributions.length === 0 && (
                  <div className="text-center py-12">
                    <FiCreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No contributions found for this month</p>
                    <p className="text-gray-500 text-sm mt-1">Record a payment to get started</p>
                  </div>
                )}
              </div>

              {/* Summary Footer */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">
                    Showing {contributions.length} payments
                  </div>
                  <div className="text-lg font-bold text-green-400">
                    Total: ₹{totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center mr-4">
                    <FiCheckCircle className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Payment Progress</h3>
                    <p className="text-sm text-gray-400">Completion rate</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${users.length > 0 ? (paidCount / users.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>{paidCount} paid</span>
                    <span>{pendingCount} pending</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                    <FiCalendar className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">Upcoming Month</h3>
                    <p className="text-sm text-gray-400">Next payment cycle</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Month:</span>
                    <span className="font-medium">
                      {format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'MMMM yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Amount:</span>
                    <span className="font-bold text-green-400">₹{users.length * 1250}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Due Date:</span>
                    <span className="font-medium">5th of each month</span>
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

export default Contributions;
