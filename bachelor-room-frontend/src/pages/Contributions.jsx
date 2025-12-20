import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Payment from '../components/Contributions/Payment';
import { format } from 'date-fns';
import { FiCheckCircle, FiXCircle, FiDownload } from 'react-icons/fi';

const Contributions = () => {
  const [contributions, setContributions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      const [contributionsRes, usersRes] = await Promise.all([
        api.get(`/contributions/month/${selectedMonth}`),
        api.get('/users'), // You'll need to create this endpoint
      ]);
      
      setContributions(contributionsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contributions</h2>
          <p className="text-gray-600">Manage monthly payments</p>
        </div>
        <div className="flex space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field w-auto"
          />
          <button className="btn-secondary flex items-center">
            <FiDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Payment History - {selectedMonth}</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Member</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((contribution) => (
                      <tr key={contribution.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{contribution.user?.name}</td>
                        <td className="py-3 px-4 font-medium">
                          ${contribution.amount}
                        </td>
                        <td className="py-3 px-4">
                          {contribution.status === 'paid' ? (
                            <span className="flex items-center text-green-600">
                              <FiCheckCircle className="mr-1" />
                              Paid
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600">
                              <FiXCircle className="mr-1" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {contribution.paid_date 
                            ? new Date(contribution.paid_date).toLocaleDateString()
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <Payment
            users={users}
            currentMonth={selectedMonth}
            onPaymentSuccess={handlePaymentSuccess}
          />
          
          <div className="card mt-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Collected:</span>
                <span className="font-bold text-green-600">
                  ${contributions.reduce((sum, c) => sum + (c.amount || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Members:</span>
                <span className="font-bold">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid Members:</span>
                <span className="font-bold">
                  {contributions.filter(c => c.status === 'paid').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Members:</span>
                <span className="font-bold">
                  {users.length - contributions.filter(c => c.status === 'paid').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributions;