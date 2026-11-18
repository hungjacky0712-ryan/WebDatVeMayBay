import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.token) {
        throw new Error(result.message || "Đăng nhập thất bại.");
      }

      sessionStorage.setItem("admin_token", result.token);
      sessionStorage.setItem("admin_user", JSON.stringify(result.user));

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Không thể kết nối máy chủ Laravel."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-logo">✈ DVMB AIR</div>

        <h1>Đăng nhập quản trị</h1>
        <p>Đăng nhập để quản lý hệ thống đặt vé máy bay.</p>

        {error && <div className="admin-login-error">{error}</div>}

        <label htmlFor="admin-email">Email quản trị</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Nhập email quản trị"
          autoComplete="username"
          required
        />

        <label htmlFor="admin-password">Mật khẩu</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <button
          type="button"
          className="admin-login-back"
          onClick={() => navigate("/")}
        >
          Quay lại trang chủ
        </button>
      </form>
    </main>
  );
}

export default AdminLogin;
