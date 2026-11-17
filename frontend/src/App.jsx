
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import FlightResults from "./pages/FlightResults";

import AirportManagement from "./pages/admin/AirportManagement";
import AircraftManagement from "./pages/admin/AircraftManagement";
import AdminLogin from "./pages/admin/AdminLogin";

import "./App.css";

function ProtectedAdminRoute({ children }) {
  const token = sessionStorage.getItem("admin_token");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flights" element={<FlightResults />} />

        <Route path="/admin/login" element={<AdminLogin />} />

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
