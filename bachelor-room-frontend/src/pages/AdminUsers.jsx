import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiEdit, FiTrash2, FiUserPlus, FiSearch, FiFilter } from 'react-icons/fi';
import CreateMember from '../components/Admin/CreateMember';
import toast from 'react-hot-toast';

const AdminUsers = () => {
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
      const response = await api.get('/admin/users');
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
      // Note: You'll need to create a delete endpoint in your backend
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      // Note: You'll need to create an update endpoint in your backend
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-600">Manage all members and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <FiUserPlus className="mr-2" />
          Add New Member
        </button>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FiFilter className="text-gray-500" />
            <span className="text-sm text-gray-600">Filter by:</span>
            <select className="border rounded-md px-3 py-1 text-sm">
              <option value="all">All Users</option>
              <option value="admin">Admins</option>
              <option value="member">Members</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Contact</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((member) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium mr-3">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">ID: {member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-gray-900">{member.email}</p>
                      <p className="text-sm text-gray-500">
                        {member.phone || 'No phone'}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={member.role || 'member'}
                      onChange={(e) => updateUserRole(member.id, e.target.value)}
                      className="px-2 py-1 border rounded-md text-sm bg-white"
                      disabled={member.id === user.id} // Can't change own role
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : member.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status || 'active'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {member.created_at ? (
                        <>
                          <p>{new Date(member.created_at).toLocaleDateString()}</p>
                          <p className="text-gray-500">
                            {new Date(member.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingUser(member)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => deleteUser(member.id)}
                        disabled={member.id === user.id}
                        className={`p-2 text-red-600 hover:bg-red-50 rounded ${
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9.647a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" />
                </svg>
              </div>
              <p className="text-gray-600">No users found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Try a different search term' : 'Add your first user to get started'}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border rounded-md text-sm">Previous</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">1</button>
            <button className="px-3 py-1 border rounded-md text-sm">Next</button>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              
              {editingUser ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={editingUser.name}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={editingUser.email}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      defaultValue={editingUser.role || 'member'}
                      className="input-field"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setEditingUser(null)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        toast.success('User updated successfully');
                        setEditingUser(null);
                        fetchUsers();
                      }}
                      className="btn-primary flex-1"
                    >
                      Update User
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
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-2xl font-bold mt-2">{users.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiUserPlus className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Admins</p>
              <p className="text-2xl font-bold mt-2">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Members</p>
              <p className="text-2xl font-bold mt-2">
                {users.filter(u => u.role === 'member' || !u.role).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0112 0c0 .459-.032.907-.096 1.344A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Today</p>
              <p className="text-2xl font-bold mt-2">
                {users.filter(u => {
                  const today = new Date().toDateString();
                  const lastActive = u.last_login_at ? new Date(u.last_login_at).toDateString() : '';
                  return lastActive === today;
                }).length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;