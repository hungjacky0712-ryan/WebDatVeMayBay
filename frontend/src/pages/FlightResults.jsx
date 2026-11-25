
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./FlightResults.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const INITIAL_DISPLAY = 20;

const CABIN_LABELS = {
  economy: "Phổ thông (Economy)",
  premium_economy: "Phổ thông đặc biệt (Premium Economy)",
  business: "Thương gia (Business)",
  first: "VIP / Hạng nhất (First)",
};

const TIME_LABELS = {
  any: "Tất cả khung giờ",
  early_morning: "Sáng sớm (00:00 - 06:00)",
  morning: "Buổi sáng (06:00 - 12:00)",
  afternoon: "Buổi chiều (12:00 - 18:00)",
  evening: "Buổi tối (18:00 - 24:00)",
};

const getIATACode = (value) => {
  if (!value) return "";

  const text = String(value).trim();
  const match = text.match(/\(([A-Za-z]{3})\)/);

  return match ? match[1].toUpperCase() : text.toUpperCase();
};

// Lấy giá thấp nhất trong các Fare của một Offer
const getPrice = (flight) => {
  const fares = Array.isArray(flight.GiaVe) ? flight.GiaVe : [];

  if (fares.length === 0) return Number.MAX_SAFE_INTEGER;

  return Math.min(
    ...fares.map((fare) => {
      const price = Number(fare.GiaVe);
      return Number.isFinite(price)
        ? price
        : Number.MAX_SAFE_INTEGER;
    })
  );
};

// Tạo khóa hành trình chiều về để tránh gộp nhầm Offer
const getReturnKey = (flight) => {
  const back = flight.ChieuVe;

  if (!back) return "";

  return [
    back.GioKhoiHanh || "",
    back.GioDen || "",
    back.IATADi || "",
    back.IATADen || "",
    ...(Array.isArray(back.HanhTrinh)
      ? back.HanhTrinh.map(
          (segment) =>
            segment?.flight_number ||
            segment?.operating_carrier?.flight_number ||
            ""
        )
      : []),
  ].join("|");
};

// Gộp các Offer cùng hành trình, giữ Offer rẻ nhất
const removeDuplicateFlights = (list) => {
  const groups = new Map();

  list.forEach((flight) => {
    const key = [
      flight.SoHieuChuyenBay || "",
      flight.GioKhoiHanh || "",
      flight.GioDen || "",
      flight.IATADi || "",
      flight.IATADen || "",
      getReturnKey(flight),
    ].join("|");

    const current = groups.get(key);

    if (!current || getPrice(flight) < getPrice(current)) {
      groups.set(key, flight);
    }
  });

  return Array.from(groups.values());
};

// Lấy giờ từ thời gian ISO của Duffel.
// Ưu tiên giờ địa phương ghi trong chuỗi thời gian.
const getHour = (value) => {
  if (!value) return null;

  const match = String(value).match(/T(\d{2}):(\d{2})/);

  if (match) {
    return Number(match[1]);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.getHours();
};

// Lọc theo khung giờ
const matchesDepartureTime = (flight, departureTime) => {
  if (!departureTime || departureTime === "any") {
    return true;
  }

  const hour = getHour(flight.GioKhoiHanh);

  if (hour === null) return false;

  switch (departureTime) {
    case "early_morning":
      return hour >= 0 && hour < 6;

    case "morning":
      return hour >= 6 && hour < 12;

    case "afternoon":
      return hour >= 12 && hour < 18;

    case "evening":
      return hour >= 18 && hour < 24;

    default:
      return true;
  }
};

function FlightResults() {
  const location = useLocation();
  const navigate = useNavigate();

  const search = location.state || {};

  const cabinClass = search.cabinClass || "economy";
  const departureTime = search.departureTime || "any";

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("departure");
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);

  // Gọi Duffel API
  useEffect(() => {
    let cancelled = false;

    const fetchFlights = async () => {
      if (!search.from || !search.to || !search.departure) {
        setError(
          "Thiếu thông tin tìm kiếm. Vui lòng quay lại trang chủ."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setFlights([]);
      setDisplayCount(INITIAL_DISPLAY);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/duffel/flights/search`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              from: getIATACode(search.from),
              to: getIATACode(search.to),
              departure: search.departure,
              return_date: search.returnDate || null,
              passengers: Number(search.passengers || 1),
              cabin_class: cabinClass,
            }),
          }
        );

        const result = await response.json();

        console.log("DUFFEL API RESPONSE:", result);
        console.log("CHUYẾN BAY ĐẦU TIÊN:", result.data?.[0]);
console.log("THÔNG TIN CHIỀU VỀ:", result.data?.[0]?.ChieuVe);

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Không thể tìm chuyến bay từ Duffel."
          );
        }

        if (!cancelled) {
          const data = Array.isArray(result.data)
            ? result.data
            : [];

          setFlights(data);
        }
      } catch (err) {
        console.error("DUFFEL API ERROR:", err);

        if (!cancelled) {
          setError(
            err.message === "Failed to fetch"
              ? "Không thể kết nối máy chủ Laravel."
              : err.message
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchFlights();

    return () => {
      cancelled = true;
    };
  }, [
    search.from,
    search.to,
    search.departure,
    search.returnDate,
    search.passengers,
    cabinClass,
  ]);

  // Định dạng giờ
  const formatTime = (value) => {
    if (!value) return "--:--";

    const match = String(value).match(/T(\d{2}):(\d{2})/);

    if (match) {
      return `${match[1]}:${match[2]}`;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "--:--";

    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Định dạng ngày
  const formatDate = (value) => {
    if (!value) return "";

    const datePart = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (datePart) {
      return `${datePart[3]}/${datePart[2]}/${datePart[1]}`;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("vi-VN");
  };

  // Tính thời gian bay
  const getDuration = (start, end) => {
    if (!start || !end) return "Chưa cập nhật";

    const startTime = new Date(start);
    const endTime = new Date(end);

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

  // Số điểm dừng = số chặng bay - 1
  const getStopLabel = (segments) => {
    const count = Number(segments);

    if (!Number.isFinite(count) || count <= 0) {
      return "Chưa cập nhật";
    }

    const stops = Math.max(0, count - 1);

    if (stops === 0) return "Bay thẳng";
    if (stops === 1) return "1 điểm dừng";

    return `${stops} điểm dừng`;
  };

  // Định dạng giá
  const formatPrice = (amount, currency) => {
    const number = Number(amount);

    if (!Number.isFinite(number)) return "Chưa có giá";

    return `${number.toLocaleString("vi-VN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency || ""}`.trim();
  };

  // Gộp Offer, lọc giờ khởi hành và sắp xếp
  const sortedFlights = useMemo(() => {
    const uniqueFlights = removeDuplicateFlights(flights);

    const filteredFlights = uniqueFlights.filter((flight) =>
      matchesDepartureTime(flight, departureTime)
    );

    return filteredFlights.sort((a, b) => {
      if (sortBy === "departure") {
        return (
          new Date(a.GioKhoiHanh) - new Date(b.GioKhoiHanh)
        );
      }

      if (sortBy === "arrival") {
        return new Date(a.GioDen) - new Date(b.GioDen);
      }

      if (sortBy === "price") {
        return getPrice(a) - getPrice(b);
      }

      return 0;
    });
  }, [flights, sortBy, departureTime]);

  const visibleFlights = sortedFlights.slice(0, displayCount);

  // Hiển thị chiều về
  const renderReturnFlight = (returnFlight) => {
    if (!returnFlight) return null;

    return (
      <div className="return-flight-info">
        <strong className="return-flight-title">
          ↩ Chiều về
        </strong>

        <div className="return-flight-times">
          <div>
            <strong>
              {formatTime(returnFlight.GioKhoiHanh)}
            </strong>

            <small>{returnFlight.IATADi || "--"}</small>

            <small>
              {formatDate(returnFlight.GioKhoiHanh)}
            </small>
          </div>

          <div className="return-flight-duration">
            <small>
              {getDuration(
                returnFlight.GioKhoiHanh,
                returnFlight.GioDen
              )}
            </small>

            <div className="flight-line"></div>

            <small>
              {getStopLabel(returnFlight.SoChang)}
            </small>
          </div>

          <div>
            <strong>
              {formatTime(returnFlight.GioDen)}
            </strong>

            <small>{returnFlight.IATADen || "--"}</small>

            <small>
              {formatDate(returnFlight.GioDen)}
            </small>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="results-page">
      <button
        className="back-btn"
        onClick={() => navigate("/")}
      >
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
          Ngày đi: {search.departure || "Chưa chọn"}
          {" · "}

          {search.returnDate
            ? `Ngày về: ${search.returnDate} · `
            : ""}

          Hành khách: {search.passengers || 1}
        </p>

        <p>
          Hạng vé: {CABIN_LABELS[cabinClass] || cabinClass}
        </p>

        <p>
          Khung giờ: {TIME_LABELS[departureTime] || "Tất cả"}
        </p>

        {!loading && !error && (
          <p>
            Tìm thấy {sortedFlights.length} chuyến bay phù hợp
            {" "}từ Duffel.

            {flights.length > sortedFlights.length &&
              ` Đã loại hoặc gộp ${
                flights.length - sortedFlights.length
              } Offer không hiển thị.`}
          </p>
        )}
      </div>

      {!loading && !error && sortedFlights.length > 0 && (
        <div className="flight-sort">
          <label htmlFor="flight-sort">
            Sắp xếp theo:
          </label>

          <select
            id="flight-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="departure">
              Giờ khởi hành
            </option>

            <option value="arrival">
              Giờ đến
            </option>

            <option value="price">
              Giá vé thấp nhất
            </option>
          </select>
        </div>
      )}

      {loading && (
        <div className="flight-message">
          Đang tìm chuyến bay từ hệ thống Duffel...
        </div>
      )}

      {!loading && error && (
        <div className="flight-message flight-error">
          {error}
        </div>
      )}

      {!loading && !error && sortedFlights.length === 0 && (
        <div className="flight-message">
          <h3>Không tìm thấy chuyến bay phù hợp</h3>

          <p>
            {flights.length > 0
              ? "Có chuyến bay từ Duffel nhưng không chuyến nào thuộc khung giờ bạn đã chọn. Hãy thử khung giờ khác."
              : "Duffel hiện chưa trả về lựa chọn chuyến bay cho hành trình và hạng vé này. Bạn hãy thử ngày, hạng vé hoặc hành trình khác."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Thay đổi tìm kiếm
          </button>
        </div>
      )}

      {!loading && !error && sortedFlights.length > 0 && (
        <>
          <div className="flight-list">
            {visibleFlights.map((flight, index) => {
              const fares = Array.isArray(flight.GiaVe)
                ? [...flight.GiaVe].sort(
                    (a, b) =>
                      Number(a.GiaVe) - Number(b.GiaVe)
                  )
                : [];

              const fare = fares[0];

              const available = fare?.SoGheConTrong;

              const soldOut =
                available !== null &&
                available !== undefined &&
                Number(available) <
                  Number(search.passengers || 1);

              return (
                <article
                  className="flight-card"
                  key={
                    flight.offer_id ||
                    `${flight.SoHieuChuyenBay}-${flight.GioKhoiHanh}-${index}`
                  }
                >
                  {/* THÔNG TIN HÃNG BAY */}
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

                  {/* CHIỀU ĐI */}
                  <div className="flight-time">
                    <strong>
                      {formatTime(flight.GioKhoiHanh)}
                    </strong>

                    <small>{flight.IATADi || "--"}</small>

                    <small>
                      {formatDate(flight.GioKhoiHanh)}
                    </small>
                  </div>

                  <div className="flight-duration">
                    <small>
                      {getDuration(
                        flight.GioKhoiHanh,
                        flight.GioDen
                      )}
                    </small>

                    <div className="flight-line"></div>

                    <small>
                      {getStopLabel(flight.SoChang)}
                    </small>
                  </div>

                  <div className="flight-time">
                    <strong>
                      {formatTime(flight.GioDen)}
                    </strong>

                    <small>{flight.IATADen || "--"}</small>

                    <small>
                      {formatDate(flight.GioDen)}
                    </small>
                  </div>

                  {/* CHIỀU VỀ */}
                  {renderReturnFlight(flight.ChieuVe)}

                  {/* GIÁ VÉ */}
                  <div className="flight-fares">
                    <div className="flight-fares-heading">
                      <div>
                        <small>Giá vé từ</small>

                        <strong>
                          {fare
                            ? formatPrice(
                                fare.GiaVe,
                                fare.TienTe
                              )
                            : "Chưa có giá"}
                        </strong>
                      </div>

                      <small>Thông tin từ Duffel</small>
                    </div>

                    <div className="fare-options">
                      {fare ? (
                        <div className="fare-option">
                          <div className="fare-option-info">
                            <strong>
                              {fare.TenHangVe ||
                                CABIN_LABELS[cabinClass]}
                            </strong>

                            <span>
                              Hành lý:{" "}
                              {fare.HanhLyKg != null
                                ? `${fare.HanhLyKg} kg`
                                : "Theo điều kiện vé"}
                            </span>

                            <span>
                              Số ghế:{" "}
                              {available != null
                                ? `Còn ${available} ghế`
                                : "Kiểm tra theo Offer"}
                            </span>
                          </div>

                          <div className="fare-option-action">
                            <strong>
                              {formatPrice(
                                fare.GiaVe,
                                fare.TienTe
                              )}
                            </strong>

                            <button
                              type="button"
                              disabled={
                                soldOut || !flight.offer_id
                              }
                              onClick={() =>
                                navigate("/flight-detail", {
                                  state: {
                                    flight: {
                                      ...flight,
                                      SelectedFare: fare,
                                    },
                                    search,
                                    selectedFare: fare,
                                    offerId: flight.offer_id,
                                  },
                                })
                              }
                            >
                              {!flight.offer_id
                                ? "Thiếu mã Offer"
                                : soldOut
                                ? "Không đủ ghế"
                                : "Chọn chuyến bay"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>
                          Offer chưa có thông tin giá vé.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {displayCount < sortedFlights.length && (
            <div className="flight-message">
              <p>
                Đang hiển thị {visibleFlights.length} /{" "}
                {sortedFlights.length} chuyến bay
              </p>

              <button
                type="button"
                onClick={() =>
                  setDisplayCount(
                    (current) => current + INITIAL_DISPLAY
                  )
                }
              >
                Xem thêm chuyến bay
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default FlightResults;
