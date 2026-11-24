
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import "./UserLayout.css";

const menuItems = [
  {
    path: "/user/dashboard",
    icon: "⌂",
    label: "Tổng quan",
  },
  {
    path: "/user/flights",
    icon: "✈",
    label: "Tìm chuyến bay",
  },
  {
    path: "/user/booking",
    icon: "▣",
    label: "Đặt vé máy bay",
    developing: true,
  },
  {
    path: "/user/payment",
    icon: "▤",
    label: "Thanh toán",
    developing: true,
  },
  {
    path: "/user/bookings",
    icon: "▥",
    label: "Lịch sử đặt vé",
    developing: true,
  },
  {
    path: "/user/tickets",
    icon: "▧",
    label: "Vé điện tử",
    developing: true,
  },
  {
    path: "/user/profile",
    icon: "♙",
    label: "Thông tin cá nhân",
    developing: true,
  },
];

export default function UserLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lấy thông tin khách hàng từ sessionStorage
  const customer = useMemo(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("customer_user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  // Xác định tên hiển thị
  const customerName =
    customer.HoTen ||
    customer.hoTen ||
    customer.name ||
    customer.TenDangNhap ||
    customer.tenDangNhap ||
    "Khách hàng";

  // Lấy chữ cái đầu làm avatar
  const avatarText = customerName
    .trim()
    .charAt(0)
    .toUpperCase() || "U";

  // Đăng xuất khách hàng
  const handleLogout = () => {
    sessionStorage.removeItem("customer_token");
    sessionStorage.removeItem("customer_user");

    navigate("/login", { replace: true });
  };

  return (
    <div className="user-layout">
      {/* SIDEBAR */}
      <aside
        className={`user-sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="user-brand">
          <div className="user-brand-icon">✈</div>

          <div>
            <h2>DVMB AIR</h2>
            <span>FLIGHT BOOKING</span>
          </div>
        </div>

        <div className="user-menu-title">
          MENU KHÁCH HÀNG
        </div>

        <nav className="user-navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `user-nav-link ${isActive ? "active" : ""} ${
                  item.developing ? "developing" : ""
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="user-nav-icon">
                {item.icon}
              </span>

              <span className="user-nav-label">
                {item.label}
              </span>

              {item.developing && (
                <span className="user-nav-badge">
                  Sắp có
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="user-sidebar-bottom">
          <div className="user-support">
            <span>?</span>

            <div>
              <strong>Trung tâm hỗ trợ</strong>
              <small>Chúng tôi luôn sẵn sàng</small>
            </div>
          </div>

          <button
            className="user-logout"
            onClick={handleLogout}
          >
            ↪ Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="user-main">
        {/* HEADER */}
        <header className="user-header">
          <button
            className="user-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Mở menu"
          >
            ☰
          </button>

          <div className="user-header-title">
            <strong>Khu vực khách hàng</strong>
            <span>
              Quản lý hành trình bay của bạn
            </span>
          </div>

          <div className="user-header-account">
            <div className="user-avatar">
              {avatarText}
            </div>

            <div>
              <strong>{customerName}</strong>
              <small>Tài khoản User</small>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="user-content">
          <Outlet />
        </main>

        {/* FOOTER */}
        <footer className="user-footer">
          © 2026 DVMB Air - Hệ thống đặt vé máy bay
        </footer>
      </div>
    </div>
  );
}
