
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../App.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function Home() {
  const navigate = useNavigate();

  const [account, setAccount] = useState(() => {
    const customerToken = sessionStorage.getItem("customer_token");
    const customerUser = sessionStorage.getItem("customer_user");

    if (customerToken && customerUser) {
      try {
        return {
          type: "customer",
          token: customerToken,
          user: JSON.parse(customerUser),
        };
      } catch {
        sessionStorage.removeItem("customer_token");
        sessionStorage.removeItem("customer_user");
      }
    }

    const adminToken = sessionStorage.getItem("admin_token");
    const adminUser = sessionStorage.getItem("admin_user");

    if (adminToken) {
      let user = { HoTen: "Quản trị viên" };

      try {
        if (adminUser) user = JSON.parse(adminUser);
      } catch {}

      return {
        type: "admin",
        token: adminToken,
        user,
      };
    }

    return null;
  });

  const [trip, setTrip] = useState("round");
  const [from, setFrom] = useState("TP. Hồ Chí Minh (SGN)");
  const [to, setTo] = useState("Hà Nội (HAN)");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const handleLogout = async () => {
    try {
      if (account?.token) {
        await fetch(`${API_BASE_URL}/api/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${account.token}`,
          },
        });
      }
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }

    sessionStorage.removeItem("customer_token");
    sessionStorage.removeItem("customer_user");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");

    setAccount(null);
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (from === to) {
      alert("Điểm đi và điểm đến không được trùng nhau!");
      return;
    }

    if (!departure) {
      alert("Vui lòng chọn ngày đi!");
      return;
    }

    if (trip === "round" && !returnDate) {
      alert("Vui lòng chọn ngày về!");
      return;
    }

    if (trip === "round" && returnDate < departure) {
      alert("Ngày về phải từ ngày đi trở đi!");
      return;
    }

    navigate("/flights", {
      state: {
        from,
        to,
        departure,
        returnDate: trip === "round" ? returnDate : "",
        passengers,
        trip,
      },
    });
  };

  return (
    <div className="app">
      {/* THANH ĐIỀU HƯỚNG */}
      <header className="navbar">
        <a className="logo" href="/">
          <span className="logo-icon">✈</span>
          <span>
            DVMB<span className="logo-highlight"> AIR</span>
          </span>
        </a>

        <nav>
          <a className="active" href="#home">Trang chủ</a>
          <a href="#search">Đặt vé</a>
          <a href="#destinations">Điểm đến</a>
          <a href="#about">Giới thiệu</a>
        </nav>

        <div className="nav-actions">
          {account ? (
            <>
              <span className="account-greeting">
                Xin chào, {account.user?.HoTen || "Người dùng"}
              </span>

              {account.type === "admin" ? (
                <button
                  className="register-btn"
                  onClick={() => navigate("/admin/sanbay")}
                >
                  Quản lý
                </button>
              ) : (
                <button
                  className="admin-login-btn"
                  onClick={() => navigate("/admin/login")}
                >
                  Quản trị viên
                </button>
              )}

              <button className="login-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </button>

              <button
                className="register-btn"
                onClick={() => navigate("/register")}
              >
                Đăng ký
              </button>

              <button
                className="admin-login-btn"
                onClick={() => navigate("/admin/login")}
              >
                Quản trị viên
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        {/* BANNER */}
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="hero-label">
              KHÁM PHÁ THẾ GIỚI CÙNG DVMB AIR
            </span>

            <h1>
              Hành trình mới,
              <br />
              Trải nghiệm mới.
            </h1>

            <p>
              Tìm kiếm chuyến bay, lựa chọn hành trình và đặt vé
              dễ dàng chỉ trong vài bước.
            </p>

            <a href="#search" className="hero-btn">
              Khám phá chuyến bay →
            </a>
          </div>

          <div className="hero-decoration">✈</div>
        </section>

        {/* FORM TÌM KIẾM */}
        <section className="booking-section" id="search">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ĐẶT VÉ TRỰC TUYẾN</span>
              <h2>Tìm chuyến bay của bạn</h2>
            </div>

            <span className="booking-icon">✈</span>
          </div>

          <form className="booking-form" onSubmit={handleSearch}>
            <div className="trip-options">
              <label>
                <input
                  type="radio"
                  name="trip"
                  checked={trip === "round"}
                  onChange={() => setTrip("round")}
                />
                Khứ hồi
              </label>

              <label>
                <input
                  type="radio"
                  name="trip"
                  checked={trip === "one"}
                  onChange={() => setTrip("one")}
                />
                Một chiều
              </label>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>ĐIỂM KHỞI HÀNH</label>
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                >
                  <option>TP. Hồ Chí Minh (SGN)</option>
                  <option>Hà Nội (HAN)</option>
                  <option>Đà Nẵng (DAD)</option>
                  <option>Phú Quốc (PQC)</option>
                  <option>Nha Trang (CXR)</option>
                </select>
              </div>

              <div className="field">
                <label>ĐIỂM ĐẾN</label>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                >
                  <option>Hà Nội (HAN)</option>
                  <option>TP. Hồ Chí Minh (SGN)</option>
                  <option>Đà Nẵng (DAD)</option>
                  <option>Phú Quốc (PQC)</option>
                  <option>Nha Trang (CXR)</option>
                </select>
              </div>

              <div className="field">
                <label>NGÀY ĐI</label>
                <input
                  type="date"
                  value={departure}
                  min={new Date().toLocaleDateString("en-CA")}
                  onChange={(e) => {
                    setDeparture(e.target.value);

                    if (returnDate && e.target.value > returnDate) {
                      setReturnDate("");
                    }
                  }}
                  required
                />
              </div>

              {trip === "round" && (
                <div className="field">
                  <label>NGÀY VỀ</label>
                  <input
                    type="date"
                    value={returnDate}
                    min={departure || new Date().toLocaleDateString("en-CA")}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="field">
                <label>HÀNH KHÁCH</label>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                    <option key={number} value={number}>
                      {number} hành khách
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="search-btn" type="submit">
              <span>⌕</span> Tìm chuyến bay
            </button>
          </form>
        </section>

        {/* ĐIỂM ĐẾN NỔI BẬT */}
        <section className="destinations" id="destinations">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ĐIỂM ĐẾN NỔI BẬT</span>
              <h2>Khám phá Việt Nam</h2>
            </div>

            <a href="#search" className="view-all">
              Khám phá ngay →
            </a>
          </div>

          <div className="destination-grid">
            <article className="destination-card destination-hanoi">
              <div>
                <span>✦</span>
                <h3>Hà Nội</h3>
                <p>Thủ đô nghìn năm văn hiến</p>
              </div>
            </article>

            <article className="destination-card destination-danang">
              <div>
                <span>✦</span>
                <h3>Đà Nẵng</h3>
                <p>Thành phố biển đáng sống</p>
              </div>
            </article>

            <article className="destination-card destination-phuquoc">
              <div>
                <span>✦</span>
                <h3>Phú Quốc</h3>
                <p>Thiên đường nghỉ dưỡng</p>
              </div>
            </article>
          </div>
        </section>

        {/* LỢI ÍCH */}
        <section className="benefits" id="about">
          <div>
            <span>✈</span>
            <h3>Đặt vé dễ dàng</h3>
            <p>Tra cứu hành trình thuận tiện</p>
          </div>

          <div>
            <span>◈</span>
            <h3>Thông tin rõ ràng</h3>
            <p>Chi tiết chuyến bay minh bạch</p>
          </div>

          <div>
            <span>♡</span>
            <h3>Hỗ trợ khách hàng</h3>
            <p>Đồng hành cùng mọi hành trình</p>
          </div>
        </section>
      </main>

      {/* CHÂN TRANG */}
      <footer>
        <a className="logo footer-logo" href="/">
          ✈ DVMB AIR
        </a>

        <p>
          © 2026 DVMB Air. Hệ thống quản lý đặt vé máy bay.
        </p>
      </footer>
    </div>
  );
}

export default Home;
