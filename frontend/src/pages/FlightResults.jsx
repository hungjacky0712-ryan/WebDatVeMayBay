
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./FlightResults.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");
console.log("FLIGHT API:", API_BASE_URL);
// Lấy mã IATA từ nội dung như:
// "TP. Hồ Chí Minh (SGN)" -> "SGN"
const getIATACode = (value) => {
  if (!value) return "";

  const match = value.match(/\(([A-Za-z]{3})\)/);

  return match ? match[1].toUpperCase() : value.trim().toUpperCase();
};

function FlightResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const search = location.state || {};

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("departure");

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError("");
      setFlights([]);

      try {
        const params = new URLSearchParams();

        if (search.from) {
          params.append("from", getIATACode(search.from));
        }

        if (search.to) {
          params.append("to", getIATACode(search.to));
        }

        if (search.departure) {
          params.append("departure", search.departure);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/chuyenbay?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Không thể tải danh sách chuyến bay."
          );
        }

        setFlights(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(
          err.message === "Failed to fetch"
            ? "Không thể kết nối máy chủ. Vui lòng kiểm tra Backend Laravel."
            : err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [search.from, search.to, search.departure]);

  const formatTime = (value) => {
    if (!value) return "--:--";

    const date = new Date(value.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return "--:--";

    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN");
  };

  const getDuration = (start, end) => {
    if (!start || !end) return "Chưa cập nhật";

    const startTime = new Date(start.replace(" ", "T"));
    const endTime = new Date(end.replace(" ", "T"));

    const minutes = Math.round(
      (endTime - startTime) / 60000
    );

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return "Chưa cập nhật";
    }

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return `${hours > 0 ? `${hours} giờ ` : ""}${remaining} phút`;
  };

  const sortedFlights = [...flights].sort((a, b) => {
    if (sortBy === "departure") {
      return new Date(a.GioKhoiHanh) - new Date(b.GioKhoiHanh);
    }

    if (sortBy === "arrival") {
      return new Date(a.GioDen) - new Date(b.GioDen);
    }

    return 0;
  });

  return (
    <main className="results-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Quay lại trang chủ
      </button>

      <div className="results-heading">
        <span className="eyebrow">
          DVMB AIR - KẾT QUẢ TÌM KIẾM
        </span>

        <h1>Chuyến bay phù hợp với bạn</h1>

        <p>
          {search.from || "Tất cả sân bay"}
          {" → "}
          {search.to || "Tất cả điểm đến"}
        </p>

        <p>
          Ngày đi: {search.departure || "Tất cả ngày"}
          {" · "}
          Hành khách: {search.passengers || 1}
        </p>

        {!loading && !error && (
          <p>Tìm thấy {flights.length} chuyến bay phù hợp.</p>
        )}
      </div>

      {!loading && !error && flights.length > 0 && (
        <div className="flight-sort">
          <label htmlFor="flight-sort">Sắp xếp theo:</label>

          <select
            id="flight-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="departure">Giờ khởi hành</option>
            <option value="arrival">Giờ đến</option>
          </select>
        </div>
      )}

      {loading && (
        <div className="flight-message">
          Đang tải danh sách chuyến bay...
        </div>
      )}

      {!loading && error && (
        <div className="flight-message flight-error">
          {error}
        </div>
      )}

      {!loading && !error && flights.length === 0 && (
        <div className="flight-message">
          <h3>Không tìm thấy chuyến bay phù hợp</h3>
          <p>
            Hiện chưa có chuyến bay nào đáp ứng điều kiện tìm kiếm.
            Bạn hãy thử chọn ngày hoặc hành trình khác.
          </p>
        </div>
      )}

      {!loading && !error && flights.length > 0 && (
        <div className="flight-list">
          {sortedFlights.map((flight) => (
            <article
              className="flight-card"
              key={flight.MaChuyenBay}
            >
              <div className="airline-info">
                <div className="airline-logo">✈</div>

                <div>
                  <strong>
                    {flight.TenHang || "Chưa cập nhật hãng"}
                  </strong>

                  <small>
                    {flight.SoHieuChuyenBay || "Chưa có số hiệu"}
                  </small>
                </div>
              </div>

              <div className="flight-time">
                <strong>{formatTime(flight.GioKhoiHanh)}</strong>
                <small>
                  {flight.IATADi || flight.TenSanBayDi}
                </small>
                <small>{formatDate(flight.GioKhoiHanh)}</small>
              </div>

              <div className="flight-duration">
                <small>
                  {getDuration(
                    flight.GioKhoiHanh,
                    flight.GioDen
                  )}
                </small>

                <div className="flight-line"></div>

                <small>Bay thẳng</small>
              </div>

              <div className="flight-time">
                <strong>{formatTime(flight.GioDen)}</strong>
                <small>
                  {flight.IATADen || flight.TenSanBayDen}
                </small>
                <small>{formatDate(flight.GioDen)}</small>
              </div>

              <div className="flight-price">
                <strong>Chưa cập nhật giá</strong>

                <small>
                  {flight.TrangThai === "TreGio"
                    ? "Chuyến bay trễ giờ"
                    : "Đã lên lịch"}
                </small>

                <button
                  onClick={() =>
                    navigate("/flight-detail", {
                      state: {
                        flight,
                        search,
                      },
                    })
                  }
                >
                  Chọn chuyến
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default FlightResults;
