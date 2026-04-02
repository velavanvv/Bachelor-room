import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { 
  FiArrowLeft,
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiUser,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import CreateMember from '../components/Admin/CreateMember';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const response = await apiService.getAllUsers();
      setUsers(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await apiService.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleBackToRoom = () => {
    const roomDoor = document.getElementById('users-room-door');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 to-yellow-900/20"></div>
        <div className="container-responsive flex min-h-[15rem] items-center justify-center py-12">
          <div className="text-center relative z-10">
            <h1 className="text-3xl font-bold mb-2">Members Management</h1>
            <p className="mx-auto max-w-md text-sm text-gray-300 sm:text-base">Manage room members, roles, and access from the same visual system as the rest of the dashboard.</p>
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
        
        {/* Add Member Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="absolute right-4 top-4 flex items-center space-x-2 rounded-xl bg-orange-600 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-orange-700 sm:right-6 sm:top-6"
        >
          <FiUserPlus />
          <span className="hidden sm:inline">Add Member</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="container-responsive relative z-10 -mt-6 pb-10 pt-4 sm:-mt-8 sm:pt-6 mobile-safe-pad">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="app-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold mt-2">{users.length}</p>
              </div>
              <div className="bg-blue-900/30 p-3 rounded-full border border-blue-700/30">
                <FiUserPlus className="text-blue-400 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="app-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Admins</p>
                <p className="text-2xl font-bold mt-2">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-full border border-purple-700/30">
                <FiUser className="text-purple-400 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="app-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Members</p>
                <p className="text-2xl font-bold mt-2">
                  {users.filter(u => u.role === 'member').length}
                </p>
              </div>
              <div className="bg-green-900/30 p-3 rounded-full border border-green-700/30">
                <FiCheckCircle className="text-green-400 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="app-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">New This Month</p>
                <p className="text-2xl font-bold mt-2">
                  {users.filter(u => {
                    const created = new Date(u.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="bg-yellow-900/30 p-3 rounded-full border border-yellow-700/30">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="app-panel mb-8 overflow-hidden">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-4">
              <div className="relative w-full sm:w-auto">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:w-64"
                />
              </div>
              <div className="min-w-0 text-sm text-gray-400">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </div>
            </div>
            <div className="flex w-full sm:w-auto">
              <div className="flex w-full items-center space-x-2 sm:w-auto">
                <FiFilter className="text-gray-400" />
                <select 
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:flex-none"
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      setFilteredUsers(users);
                    } else {
                      setFilteredUsers(users.filter(u => u.role === e.target.value));
                    }
                  }}
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admins</option>
                  <option value="member">Members</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-400">ID: {member.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{member.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={member.role || 'member'}
                        onChange={(e) => updateUserRole(member.id, e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        disabled={member.id === user.id}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{formatDate(member.created_at)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded bg-green-900/50 text-green-400 border border-green-700/50">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingUser(member)}
                          className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => deleteUser(member.id)}
                          disabled={member.id === user.id}
                          className={`p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors ${
                            member.id === user.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={member.id === user.id ? "Can't delete yourself" : "Delete"}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredUsers.map((member) => (
              <div key={member.id} className="app-subtle p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-orange-600 to-yellow-600 text-lg font-medium text-white flex items-center justify-center">
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="break-all text-sm text-gray-400">{member.email}</p>
                      </div>
                      <div className="flex shrink-0 space-x-1">
                        <button
                          onClick={() => setEditingUser(member)}
                          className="rounded p-2 text-blue-400 hover:bg-blue-900/30"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => deleteUser(member.id)}
                          disabled={member.id === user.id}
                          className={`rounded p-2 text-red-400 hover:bg-red-900/30 ${
                            member.id === user.id ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={member.role || 'member'}
                        onChange={(e) => updateUserRole(member.id, e.target.value)}
                        className="min-w-0 rounded px-2 py-1 text-xs bg-gray-700 border border-gray-600"
                        disabled={member.id === user.id}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <span className="rounded bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                        Active
                      </span>
                      <span className="text-xs text-gray-400">
                        Joined: {formatDate(member.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9.647a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
                </svg>
              </div>
              <p className="text-gray-400">No users found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm ? 'Try a different search term' : 'Add your first user to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="app-panel">
          <h2 className="text-xl font-bold mb-6">Recent Member Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="app-subtle p-4">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-900/50 rounded-full flex items-center justify-center mr-3">
                  <FiCheckCircle className="text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Active Members</p>
                  <p className="text-sm text-gray-400">{users.filter(u => u.role === 'member').length} users</p>
                </div>
              </div>
            </div>
            <div className="app-subtle p-4">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-900/50 rounded-full flex items-center justify-center mr-3">
                  <FiUser className="text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">New This Week</p>
                  <p className="text-sm text-gray-400">
                    {users.filter(u => {
                      const created = new Date(u.created_at);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return created > weekAgo;
                    }).length} users
                  </p>
                </div>
              </div>
            </div>
            <div className="app-subtle p-4">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-purple-900/50 rounded-full flex items-center justify-center mr-3">
                  <FiUserPlus className="text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Pending Actions</p>
                  <p className="text-sm text-gray-400">0 pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="app-panel w-full max-w-md max-h-[90vh] overflow-y-auto border-white/10 bg-[linear-gradient(180deg,_rgba(19,27,23,0.95),_rgba(10,15,13,0.98))]">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingUser ? 'Edit User' : 'Add New Member'}
              </h3>
              
              {editingUser ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      defaultValue={editingUser.name}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Name cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      defaultValue={editingUser.email}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                    <select
                      defaultValue={editingUser.role || 'member'}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      onChange={(e) => updateUserRole(editingUser.id, e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setEditingUser(null)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <CreateMember
                  onSuccess={() => {
                    setShowCreateModal(false);
                    fetchUsers();
                  }}
                />
              )}
            </div>
            
            {!editingUser && (
              <div className="px-6 py-4 bg-gray-900/50 rounded-b-2xl border-t border-gray-700">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
