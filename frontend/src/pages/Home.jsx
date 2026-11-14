
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../App.css";

function Home() {
  // Điều hướng sang trang khác
  const navigate = useNavigate();

  // Dữ liệu tìm kiếm chuyến bay
  const [trip, setTrip] = useState("round");

  const [from, setFrom] = useState("TP. Hồ Chí Minh (SGN)");
  const [to, setTo] = useState("Hà Nội (HAN)");

  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [passengers, setPassengers] = useState(1);

  // Xử lý khi nhấn nút tìm chuyến bay
  const handleSearch = (e) => {
    e.preventDefault();

    // Kiểm tra điểm đi và điểm đến
    if (from === to) {
      alert("Điểm đi và điểm đến không được trùng nhau!");
      return;
    }

    // Kiểm tra ngày đi
    if (!departure) {
      alert("Vui lòng chọn ngày đi!");
      return;
    }

    // Kiểm tra ngày về
    if (trip === "round" && !returnDate) {
      alert("Vui lòng chọn ngày về!");
      return;
    }

    if (trip === "round" && returnDate < departure) {
      alert("Ngày về phải từ ngày đi trở đi!");
      return;
    }

    // Chuyển dữ liệu tìm kiếm sang trang kết quả
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
          <button className="login-btn">Đăng nhập</button>
          <button className="register-btn">Đăng ký</button>
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

            {/* LOẠI CHUYẾN BAY */}
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

            {/* THÔNG TIN HÀNH TRÌNH */}
            <div className="form-grid">

              {/* ĐIỂM ĐI */}
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

              {/* ĐIỂM ĐẾN */}
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

              {/* NGÀY ĐI */}
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

              {/* NGÀY VỀ */}
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

              {/* SỐ HÀNH KHÁCH */}
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

            {/* NÚT TÌM KIẾM */}
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
