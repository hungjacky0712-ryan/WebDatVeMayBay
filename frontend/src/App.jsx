
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import FlightResults from "./pages/FlightResults";

import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";

import AirportManagement from "./pages/admin/AirportManagement";
import AircraftManagement from "./pages/admin/AircraftManagement";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FlightManagement from "./pages/admin/FlightManagement";
import PassengerManagement from "./pages/admin/PassengerManagement";

import UserLayout from "./layouts/UserLayout";
import UserDashboard from "./pages/user/UserDashboard";

import "./App.css";

function ProtectedAdminRoute({ children }) {
  const token = sessionStorage.getItem("admin_token");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function ProtectedCustomerRoute({ children }) {
  const token = sessionStorage.getItem("customer_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang khách hàng */}
        <Route path="/" element={<Home />} />
        <Route path="/flights" element={<FlightResults />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<CustomerRegister />} />

        {/* Trang khách hàng đã đăng nhập */}
        <Route
          path="/user"
          element={
            <ProtectedCustomerRoute>
              <UserLayout />
            </ProtectedCustomerRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/user/dashboard" replace />}
          />
          <Route path="dashboard" element={<UserDashboard />} />
        </Route>

        {/* Trang quản trị */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/sanbay"
          element={
            <ProtectedAdminRoute>
              <AirportManagement />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/maybay"
          element={
            <ProtectedAdminRoute>
              <AircraftManagement />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/chuyenbay"
          element={
            <ProtectedAdminRoute>
              <FlightManagement />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/hanhkhach"
          element={
            <ProtectedAdminRoute>
              <PassengerManagement />
            </ProtectedAdminRoute>
          }
        />

        {/* Đường dẫn không tồn tại */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
