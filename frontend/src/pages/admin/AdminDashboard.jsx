import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Quản lý sân bay",
      description: "Thêm, sửa, xóa và xem danh sách sân bay.",
      icon: "✈",
      color: "blue",
      path: "/admin/sanbay",
    },
    {
      title: "Quản lý máy bay",
      description: "Quản lý thông tin và danh sách máy bay.",
      icon: "🛫",
      color: "green",
      path: "/admin/maybay",
    },
    {
      title: "Quản lý chuyến bay",
      description: "Theo dõi và quản lý các chuyến bay.",
      icon: "🗺",
      color: "purple",
      path: null,
    },
    {
      title: "Quản lý khách hàng",
      description: "Xem và quản lý thông tin khách hàng.",
      icon: "👥",
      color: "orange",
      path: null,
    },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="dashboard-logo">✈</span>
          <div>
            <h2>DVMB AIR</h2>
            <p>ADMINISTRATION SYSTEM</p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <span className="admin-badge">QUẢN TRỊ VIÊN</span>
          <button onClick={() => navigate("/")}>Trang chủ</button>
          <button className="dashboard-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">ADMIN CONTROL PANEL</span>
            <h1>Bảng điều khiển</h1>
            <p>
              Chào mừng bạn đến với hệ thống quản lý đặt vé máy bay DVMB AIR.
              Hãy chọn chức năng cần quản lý.
            </p>
          </div>
        </div>

        <div className="dashboard-section-title">
          <div>
            <h2>Chức năng quản lý</h2>
            <p>Truy cập nhanh các phân hệ của hệ thống</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {menuItems.map((item) => (
            <article className={`dashboard-card ${item.color}`} key={item.title}>
              <div className="dashboard-card-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button
                disabled={!item.path}
                onClick={() => item.path && navigate(item.path)}
              >
                {item.path ? "Truy cập chức năng →" : "Đang phát triển"}
              </button>
            </article>
          ))}
        </div>
      </main>

      <footer className="dashboard-footer">
        © 2026 DVMB AIR - Hệ thống quản lý đặt vé máy bay
      </footer>
    </div>
  );
}

export default AdminDashboard;
