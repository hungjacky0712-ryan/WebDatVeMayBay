
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const sampleFlights = [
  {
    id: 1,
    airline: "Vietnam Airlines",
    code: "VN 210",
    departure: "08:00",
    arrival: "10:10",
    from: "SGN",
    to: "HAN",
    duration: "2 giờ 10 phút",
    price: 1850000,
  },
  {
    id: 2,
    airline: "VietJet Air",
    code: "VJ 122",
    departure: "10:30",
    arrival: "12:40",
    from: "SGN",
    to: "HAN",
    duration: "2 giờ 10 phút",
    price: 1250000,
  },
  {
    id: 3,
    airline: "Bamboo Airways",
    code: "QH 202",
    departure: "14:00",
    arrival: "16:10",
    from: "SGN",
    to: "HAN",
    duration: "2 giờ 10 phút",
    price: 1550000,
  },
];

function FlightResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const search = location.state || {};

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price) + " đ";

  return (
    <main className="results-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Quay lại trang chủ
      </button>

      <div className="results-heading">
        <span className="eyebrow">KẾT QUẢ TÌM KIẾM</span>
        <h1>Chuyến bay phù hợp với bạn</h1>
        <p>
          {search.from || "TP. Hồ Chí Minh (SGN)"} →{" "}
          {search.to || "Hà Nội (HAN)"}
        </p>
        <p>
          Ngày đi: {search.departure || "Chưa chọn"} ·{" "}
          Hành khách: {search.passengers || 1}
        </p>
      </div>

      <div className="flight-list">
        {sampleFlights.map((flight) => (
          <article className="flight-card" key={flight.id}>
            <div className="airline-info">
              <div className="airline-logo">✈</div>
              <div>
                <strong>{flight.airline}</strong>
                <small>{flight.code}</small>
              </div>
            </div>

            <div className="flight-time">
              <strong>{flight.departure}</strong>
              <small>{flight.from}</small>
            </div>

            <div className="flight-duration">
              <small>{flight.duration}</small>
              <div className="flight-line"></div>
              <small>Bay thẳng</small>
            </div>

            <div className="flight-time">
              <strong>{flight.arrival}</strong>
              <small>{flight.to}</small>
            </div>

            <div className="flight-price">
              <strong>{formatPrice(flight.price)}</strong>
              <small>/ hành khách</small>
              <button onClick={() => navigate("/flight-detail", {
                state: { flight, search }
              })}>
                Chọn chuyến
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="demo-note">
        * Đây là dữ liệu chuyến bay minh họa, chưa lấy từ cơ sở dữ liệu.
      </p>
    </main>
  );
}

export default FlightResults;
