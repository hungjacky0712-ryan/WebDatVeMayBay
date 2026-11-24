import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./CustomerAuth.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/login`, {
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

sessionStorage.setItem("customer_token", result.token);
sessionStorage.setItem("customer_user", JSON.stringify(result.user));

// Chuyển đến giao diện User mới
navigate("/user/dashboard", { replace: true });
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
    <main className="customer-auth-page">
      <form className="customer-auth-card" onSubmit={handleSubmit}>
        <Link to="/" className="customer-auth-logo">
          ✈ DVMB <span>AIR</span>
        </Link>

        <h1>Đăng nhập</h1>
        <p>Đăng nhập tài khoản khách hàng của bạn.</p>

        {error && <div className="auth-error">{error}</div>}

        <label htmlFor="customer-email">Email</label>
        <input
          id="customer-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email"
          required
        />

        <label htmlFor="customer-password">Mật khẩu</label>
        <input
          id="customer-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div className="customer-auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </form>
    </main>
  );
}

export default CustomerLogin;
