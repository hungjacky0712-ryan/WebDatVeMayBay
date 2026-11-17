import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CustomerAuth.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function CustomerRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    hoTen: "",
    email: "",
    soDienThoai: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          hoTen: form.hoTen,
          email: form.email,
          soDienThoai: form.soDienThoai || null,
          password: form.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errors = result.errors
          ? Object.values(result.errors).flat().join(" ")
          : "";
        throw new Error(errors || result.message || "Đăng ký thất bại.");
      }

      setSuccess("Đăng ký thành công! Đang chuyển đến đăng nhập.");

      setTimeout(() => {
        navigate("/login", { state: { email: form.email } });
      }, 1200);
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

        <h1>Tạo tài khoản</h1>
        <p>Đăng ký để bắt đầu hành trình cùng DVMB AIR.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <label htmlFor="hoTen">Họ và tên</label>
        <input id="hoTen" name="hoTen" value={form.hoTen}
          onChange={handleChange} maxLength={100} required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={form.email}
          onChange={handleChange} maxLength={100} required />

        <label htmlFor="soDienThoai">Số điện thoại</label>
        <input id="soDienThoai" name="soDienThoai" type="tel"
          value={form.soDienThoai} onChange={handleChange} maxLength={15} />

        <label htmlFor="password">Mật khẩu</label>
        <input id="password" name="password" type="password"
          value={form.password} onChange={handleChange}
          minLength={8} maxLength={72} required />

        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
        <input id="confirmPassword" name="confirmPassword" type="password"
          value={form.confirmPassword} onChange={handleChange} required />

        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <div className="customer-auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </form>
    </main>
  );
}

export default CustomerRegister;
