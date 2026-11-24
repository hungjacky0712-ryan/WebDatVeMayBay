
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";

const features = [
  {
    icon: "✈",
    title: "Tìm chuyến bay",
    description: "Tìm kiếm chuyến bay phù hợp với hành trình của bạn.",
    path: "/user/flights",
    status: "Sẵn sàng",
    active: true,
  },
  {
    icon: "▣",
    title: "Đặt vé máy bay",
    description: "Lựa chọn chuyến bay và nhập thông tin hành khách.",
    status: "Đang phát triển",
  },
  {
    icon: "▤",
    title: "Thanh toán",
    description: "Theo dõi và thực hiện thanh toán đơn đặt vé.",
    status: "Đang phát triển",
  },
  {
    icon: "▥",
    title: "Lịch sử đặt vé",
    description: "Xem lại các đơn đặt vé đã thực hiện.",
    status: "Đang phát triển",
  },
  {
    icon: "▧",
    title: "Vé điện tử",
    description: "Tra cứu thông tin vé máy bay của bạn.",
    status: "Đang phát triển",
  },
  {
    icon: "♙",
    title: "Thông tin cá nhân",
    description: "Quản lý và cập nhật thông tin tài khoản.",
    status: "Đang phát triển",
  },
];

export default function UserDashboard() {
  const navigate = useNavigate();

  return (
    <div className="user-dashboard">
      <section className="user-welcome">
        <div>
          <span className="welcome-label">CUSTOMER PORTAL</span>
          <h1>Xin chào, Quý khách!</h1>
          <p>
            Chào mừng bạn đến với hệ thống đặt vé máy bay.
            Hãy bắt đầu hành trình tiếp theo của mình.
          </p>

          <button onClick={() => navigate("/user/flights")}>
            <span>✈</span> Tìm chuyến bay ngay
          </button>
        </div>

        <div className="welcome-plane">✈</div>
      </section>

      <section className="user-section">
        <div className="user-section-heading">
          <div>
            <h2>Trung tâm tiện ích</h2>
            <p>Các chức năng dành cho khách hàng</p>
          </div>
        </div>

        <div className="user-feature-grid">
          {features.map((feature, index) => (
            <article
              className={`user-feature-card ${
                feature.active ? "available" : "unavailable"
              }`}
              key={index}
            >
              <div className="feature-top">
                <div className="feature-icon">{feature.icon}</div>
                <span
                  className={`feature-status ${
                    feature.active ? "ready" : "pending"
                  }`}
                >
                  {feature.status}
                </span>
              </div>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>

              <button
                disabled={!feature.active}
                onClick={() => feature.path && navigate(feature.path)}
              >
                {feature.active ? "Truy cập chức năng →" : "Sắp ra mắt"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="user-notice">
        <div className="notice-icon">ⓘ</div>
        <div>
          <strong>Thông báo dành cho khách hàng</strong>
          <p>
            Một số chức năng đang trong quá trình hoàn thiện.
            Chúng tôi sẽ sớm cập nhật để mang đến trải nghiệm tốt hơn.
          </p>
        </div>
      </section>
    </div>
  );
}
