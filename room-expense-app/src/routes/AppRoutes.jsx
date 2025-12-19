import { Routes, Route } from "react-router-dom";
import Login from "../auth/Login";
import ProtectedRoute from "../auth/ProtectedRoute";

import AdminDashboard from "../pages/admin/Dashboard";
import CreateMember from "../pages/admin/CreateMember";
import MemberDashboard from "../pages/member/Dashboard";

export default function AppRoutes() {
  return (
    <div>
     
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/create-member"
        element={
          <ProtectedRoute role="admin">
            <CreateMember />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/dashboard"
        element={
          <ProtectedRoute role="member">
            <MemberDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
    </div>
  );
}
