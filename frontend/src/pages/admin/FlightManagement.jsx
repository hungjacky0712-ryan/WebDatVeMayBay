
import { useCallback, useEffect, useState } from "react";
import "./FlightManagement.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");
console.log("FLIGHT API:", API_BASE_URL);
const emptyForm = {
  MaHang: "",
  MaMayBay: "",
  SoHieuChuyenBay: "",
  MaSanBayDi: "",
  MaSanBayDen: "",
  GioKhoiHanh: "",
  GioDen: "",
  TrangThai: "DaLenLich",
};

const statuses = [
  { value: "DaLenLich", label: "Đã lên lịch" },
  { value: "DaKhoiHanh", label: "Đã khởi hành" },
  { value: "TreGio", label: "Trễ giờ" },
  { value: "DaDen", label: "Đã đến" },
  { value: "DaHuy", label: "Đã hủy" },
];

const getHeaders = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("admin_token") || ""}`,
});

const normalizeRows = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  return [];
};

const getStatusLabel = (value) =>
  statuses.find((item) => item.value === value)?.label || value;

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 16);
};

const readApiResponse = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const getApiError = (result, status) => {
  if (result?.errors) {
    return Object.entries(result.errors)
      .map(([field, messages]) => {
        const detail = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);

        return `${field}: ${detail}`;
      })
      .join("\n");
  }

  return (
    result?.message ||
    result?.error ||
    `Yêu cầu thất bại. HTTP ${status}`
  );
};

function FlightManagement() {
  const [flights, setFlights] = useState([]);

  const [airlines, setAirlines] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [airports, setAirports] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // TẢI DANH MỤC LIÊN KẾT
  const loadReferenceData = useCallback(async () => {
    setLoadingOptions(true);

    try {
      const endpoints = [
        `${API_BASE_URL}/api/hanghangkhong`,
        `${API_BASE_URL}/api/maybay`,
        `${API_BASE_URL}/api/sanbay`,
      ];

      const responses = await Promise.all(
        endpoints.map((url) =>
          fetch(url, { headers: getHeaders() })
        )
      );

      const results = await Promise.all(
        responses.map(async (response) => {
          const result = await readApiResponse(response);

          if (!response.ok) {
            throw new Error(getApiError(result, response.status));
          }

          return result;
        })
      );

      setAirlines(normalizeRows(results[0]));
      setAircrafts(normalizeRows(results[1]));
      setAirports(normalizeRows(results[2]));
    } catch (err) {
      setError(`Không tải được dữ liệu danh mục: ${err.message}`);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  // TẢI DANH SÁCH CHUYẾN BAY
  const loadFlights = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chuyenbay`,
        { headers: getHeaders() }
      );

      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(getApiError(result, response.status));
      }

      setFlights(normalizeRows(result));
    } catch (err) {
      setError(err.message || "Không tải được danh sách chuyến bay.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlights();
    loadReferenceData();
  }, [loadFlights, loadReferenceData]);

  // THAY ĐỔI FORM
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  // RESET FORM
  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
  };

  // THÊM / CẬP NHẬT CHUYẾN BAY
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.MaHang ||
      !form.SoHieuChuyenBay.trim() ||
      !form.MaSanBayDi ||
      !form.MaSanBayDen ||
      !form.GioKhoiHanh ||
      !form.GioDen
    ) {
      setError("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }

    if (form.MaSanBayDi === form.MaSanBayDen) {
      setError("Sân bay đi và sân bay đến không được trùng nhau.");
      return;
    }

    const departureTime = new Date(form.GioKhoiHanh).getTime();
    const arrivalTime = new Date(form.GioDen).getTime();

    if (
      Number.isNaN(departureTime) ||
      Number.isNaN(arrivalTime) ||
      arrivalTime <= departureTime
    ) {
      setError("Giờ đến phải sau giờ khởi hành.");
      return;
    }

    const payload = {
      MaHang: Number(form.MaHang),
      MaMayBay: form.MaMayBay
        ? Number(form.MaMayBay)
        : null,
      SoHieuChuyenBay: form.SoHieuChuyenBay.trim(),
      MaSanBayDi: Number(form.MaSanBayDi),
      MaSanBayDen: Number(form.MaSanBayDen),
      GioKhoiHanh: form.GioKhoiHanh,
      GioDen: form.GioDen,
      TrangThai: form.TrangThai,
    };

    const url = editingId
      ? `${API_BASE_URL}/api/chuyenbay/${editingId}`
      : `${API_BASE_URL}/api/chuyenbay`;

    setSaving(true);

    console.log("DỮ LIỆU GỬI LÊN API:", payload);

    try {
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await readApiResponse(response);

      if (!response.ok) {
        console.error("LỖI API CHUYẾN BAY:", {
          status: response.status,
          response: result,
          payload,
        });

        throw new Error(
          `HTTP ${response.status}: ${getApiError(result, response.status)}`
        );
      }

      setMessage(
        result.message ||
          (editingId
            ? "Cập nhật chuyến bay thành công."
            : "Thêm chuyến bay thành công.")
      );

      setForm({ ...emptyForm });
      setEditingId(null);

      await loadFlights();
    } catch (err) {
      setError(err.message || "Có lỗi khi lưu chuyến bay.");
    } finally {
      setSaving(false);
    }
  };

  // SỬA CHUYẾN BAY
  const handleEdit = (flight) => {
    setEditingId(flight.MaChuyenBay);

    setForm({
      MaHang: String(flight.MaHang ?? ""),
      MaMayBay:
        flight.MaMayBay == null
          ? ""
          : String(flight.MaMayBay),
      SoHieuChuyenBay: flight.SoHieuChuyenBay ?? "",
      MaSanBayDi: String(flight.MaSanBayDi ?? ""),
      MaSanBayDen: String(flight.MaSanBayDen ?? ""),
      GioKhoiHanh: toDateTimeLocal(flight.GioKhoiHanh),
      GioDen: toDateTimeLocal(flight.GioDen),
      TrangThai: flight.TrangThai ?? "DaLenLich",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // XÓA CHUYẾN BAY
  const handleDelete = async (id) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chuyến bay ${id}?`)) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/chuyenbay/${id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(getApiError(result, response.status));
      }

      setMessage(result.message || "Xóa chuyến bay thành công.");

      await loadFlights();
    } catch (err) {
      setError(err.message || "Lỗi khi xóa chuyến bay.");
    }
  };

  // TÌM TÊN HÃNG
  const getAirlineName = (id) => {
    const item = airlines.find(
      (x) => String(x.MaHang) === String(id)
    );

    return item?.TenHang || "";
  };

  // TÌM DÒNG MÁY BAY
  const getAircraftName = (id) => {
    if (id == null) return "Chưa phân công";

    const item = aircrafts.find(
      (x) => String(x.MaMayBay) === String(id)
    );

    return item?.DongMay || "";
  };

  // TÌM SÂN BAY
  const getAirport = (id) => {
    const item = airports.find(
      (x) => String(x.MaSanBay) === String(id)
    );

    if (!item) return "";

    return `${item.MaIATA || ""} - ${item.TenSanBay || ""}`;
  };

  return (
    <main className="flight-page">
      <div className="flight-container">

        <div className="flight-heading">
          <div>
            <p className="flight-eyebrow">
              HỆ THỐNG ĐẶT VÉ MÁY BAY
            </p>

            <h1>Quản lý chuyến bay</h1>

            <p className="flight-subtitle">
              Thêm, sửa, xóa và theo dõi chuyến bay.
            </p>
          </div>

          <button
            type="button"
            className="flight-button flight-button-light"
            onClick={() => {
              loadFlights();
              loadReferenceData();
            }}
            disabled={loading || loadingOptions}
          >
            ↻ Làm mới
          </button>
        </div>

        {message && (
          <div className="flight-alert flight-alert-success">
            {message}
          </div>
        )}

        {error && (
          <div className="flight-alert flight-alert-error">
            {error}
          </div>
        )}

        {/* FORM THÊM / SỬA */}
        <section className="flight-panel">
          <div className="flight-panel-title">
            <h2>
              {editingId
                ? `Cập nhật chuyến bay #${editingId}`
                : "Thêm chuyến bay"}
            </h2>

            {editingId && (
              <button
                type="button"
                className="flight-text-button"
                onClick={resetForm}
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          <form className="flight-form" onSubmit={handleSubmit}>

            <label>
              Hãng hàng không *
              <select
                name="MaHang"
                required
                value={form.MaHang}
                onChange={handleChange}
                disabled={loadingOptions}
              >
                <option value="">-- Chọn hãng hàng không --</option>

                {airlines.map((item) => (
                  <option key={item.MaHang} value={item.MaHang}>
                    {item.MaHang} - {item.TenHang}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Máy bay
              <select
                name="MaMayBay"
                value={form.MaMayBay}
                onChange={handleChange}
                disabled={loadingOptions}
              >
                <option value="">-- Chưa phân công máy bay --</option>

                {aircrafts.map((item) => (
                  <option
                    key={item.MaMayBay}
                    value={item.MaMayBay}
                  >
                    {item.MaMayBay} - {item.DongMay}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Số hiệu chuyến bay *
              <input
                type="text"
                name="SoHieuChuyenBay"
                maxLength="40"
                required
                value={form.SoHieuChuyenBay}
                onChange={handleChange}
                placeholder="Ví dụ: VN123"
              />
            </label>

            <label>
              Sân bay đi *
              <select
                name="MaSanBayDi"
                required
                value={form.MaSanBayDi}
                onChange={handleChange}
                disabled={loadingOptions}
              >
                <option value="">-- Chọn sân bay đi --</option>

                {airports.map((item) => (
                  <option
                    key={item.MaSanBay}
                    value={item.MaSanBay}
                    disabled={
                      String(item.MaSanBay) === form.MaSanBayDen
                    }
                  >
                    {item.MaSanBay} - {item.MaIATA} - {item.TenSanBay}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sân bay đến *
              <select
                name="MaSanBayDen"
                required
                value={form.MaSanBayDen}
                onChange={handleChange}
                disabled={loadingOptions}
              >
                <option value="">-- Chọn sân bay đến --</option>

                {airports.map((item) => (
                  <option
                    key={item.MaSanBay}
                    value={item.MaSanBay}
                    disabled={
                      String(item.MaSanBay) === form.MaSanBayDi
                    }
                  >
                    {item.MaSanBay} - {item.MaIATA} - {item.TenSanBay}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Giờ khởi hành *
              <input
                type="datetime-local"
                name="GioKhoiHanh"
                required
                value={form.GioKhoiHanh}
                onChange={handleChange}
              />
            </label>

            <label>
              Giờ đến *
              <input
                type="datetime-local"
                name="GioDen"
                required
                min={form.GioKhoiHanh || undefined}
                value={form.GioDen}
                onChange={handleChange}
              />
            </label>

            <label>
              Trạng thái *
              <select
                name="TrangThai"
                required
                value={form.TrangThai}
                onChange={handleChange}
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flight-form-actions">
              <button
                type="submit"
                className="flight-button flight-button-primary"
                disabled={saving || loadingOptions}
              >
                {saving
                  ? "Đang lưu..."
                  : editingId
                    ? "Lưu thay đổi"
                    : "+ Thêm chuyến bay"}
              </button>

              <button
                type="button"
                className="flight-button flight-button-light"
                onClick={resetForm}
              >
                Nhập lại
              </button>
            </div>
          </form>

          <p className="flight-note">
            Chọn hãng hàng không, máy bay và sân bay từ dữ liệu có sẵn.
            Mã liên kết sẽ được lưu vào bảng ChuyenBay.
            Giờ đến phải sau giờ khởi hành.
          </p>
        </section>

        {/* DANH SÁCH CHUYẾN BAY */}
        <section className="flight-panel">
          <div className="flight-panel-title">
            <div>
              <h2>Danh sách chuyến bay</h2>
              <p className="flight-count">
                {flights.length} chuyến bay
              </p>
            </div>
          </div>

          <div className="flight-table-wrap">
            <table className="flight-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã Chuyến Bay</th>
                  <th>Số hiệu</th>
                  <th>Mã hãng</th>
                  <th>Tên hãng</th>
                  <th>Mã máy bay</th>
                  <th>Dòng máy bay</th>
                  <th>Mã sân bay đi</th>
                  <th>Sân bay đi</th>
                  <th>Mã sân bay đến</th>
                  <th>Sân bay đến</th>
                  <th>Giờ khởi hành</th>
                  <th>Giờ đến</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="15" className="flight-empty">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : flights.length === 0 ? (
                  <tr>
                    <td colSpan="15" className="flight-empty">
                      Chưa có dữ liệu chuyến bay.
                    </td>
                  </tr>
                ) : (
                  flights.map((flight,index) => (
                    <tr key={flight.MaChuyenBay}>
                      <td>{index + 1}</td>
                      <td>{flight.MaChuyenBay}</td>
                      <td>{flight.SoHieuChuyenBay}</td>

                      <td>{flight.MaHang}</td>
                      <td>
                        {flight.TenHang ||
                          getAirlineName(flight.MaHang)}
                      </td>

                      <td>{flight.MaMayBay ?? "—"}</td>
                      <td>
                        {flight.DongMay ||
                          getAircraftName(flight.MaMayBay)}
                      </td>

                      <td>{flight.MaSanBayDi}</td>
                      <td>
                        {flight.TenSanBayDi ||
                          getAirport(flight.MaSanBayDi)}
                      </td>

                      <td>{flight.MaSanBayDen}</td>
                      <td>
                        {flight.TenSanBayDen ||
                          getAirport(flight.MaSanBayDen)}
                      </td>

                      <td>{formatDateTime(flight.GioKhoiHanh)}</td>
                      <td>{formatDateTime(flight.GioDen)}</td>

                      <td>{getStatusLabel(flight.TrangThai)}</td>

                      <td>
                        <div className="flight-row-actions">
                          <button
                            type="button"
                            className="flight-action-edit"
                            onClick={() => handleEdit(flight)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="flight-action-delete"
                            onClick={() =>
                              handleDelete(flight.MaChuyenBay)
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default FlightManagement;
