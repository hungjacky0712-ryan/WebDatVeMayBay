
import { useCallback, useEffect, useMemo, useState } from "react";
import "./AirportManagement.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/api/sanbay`;

const EMPTY_FORM = {
  MaIATA: "",
  TenSanBay: "",
  ThanhPho: "",
  QuocGia: "",
};

function AirportManagement() {
  const [airports, setAirports] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const fetchAirports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể tải danh sách sân bay.");
      }

      setAirports(result.data || []);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Không thể kết nối API. Hãy kiểm tra Laravel server và cấu hình CORS."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAirports();
  }, [fetchAirports]);

  const filteredAirports = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    if (!search) return airports;

    return airports.filter((airport) =>
      [
        airport.MaIATA,
        airport.TenSanBay,
        airport.ThanhPho,
        airport.QuocGia,
      ].some((value) => String(value || "").toLowerCase().includes(search))
    );
  }, [airports, keyword]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "MaIATA" ? value.toUpperCase() : value,
    }));

    setValidationErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));

    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setValidationErrors({});
    setError("");
    setSuccess("");
  };

  const handleEdit = (airport) => {
    setEditingId(airport.MaSanBay);
    setForm({
      MaIATA: airport.MaIATA?.trim() || "",
      TenSanBay: airport.TenSanBay || "",
      ThanhPho: airport.ThanhPho || "",
      QuocGia: airport.QuocGia || "",
    });

    setValidationErrors({});
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");
    setValidationErrors({});

    try {
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            MaIATA: form.MaIATA.trim(),
            TenSanBay: form.TenSanBay.trim(),
            ThanhPho: form.ThanhPho.trim(),
            QuocGia: form.QuocGia.trim(),
          }),
        }
      );

      const result = await response.json();

      if (response.status === 422) {
        setValidationErrors(result.errors || {});
        throw new Error(result.message || "Dữ liệu chưa hợp lệ.");
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể lưu sân bay.");
      }

      setSuccess(
        isEditing
          ? "Cập nhật sân bay thành công."
          : "Thêm sân bay thành công."
      );

      resetForm();
      await fetchAirports();
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Không thể kết nối API. Hãy kiểm tra máy chủ Laravel."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (airport) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa sân bay ${airport.TenSanBay} (${airport.MaIATA.trim()})?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${airport.MaSanBay}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể xóa sân bay.");
      }

      setSuccess("Xóa sân bay thành công.");
      await fetchAirports();
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Không thể kết nối API. Hãy kiểm tra máy chủ Laravel."
          : err.message
      );
    }
  };

  const getFieldError = (field) => validationErrors[field]?.[0];

  return (
    <div className="airport-management">
      <header className="airport-header">
        <div>
          <span className="airport-header-label">ADMINISTRATION</span>
          <h1>Quản lý sân bay</h1>
          <p>Quản lý thông tin sân bay trong hệ thống đặt vé máy bay.</p>
        </div>

        <div className="airport-header-icon" aria-hidden="true">
          ✈
        </div>
      </header>

      <main className="airport-content">
        {error && (
          <div className="airport-alert airport-alert-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="airport-alert airport-alert-success" role="status">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")}>
              ×
            </button>
          </div>
        )}

        <section className="airport-panel">
          <div className="airport-panel-heading">
            <div>
              <h2>{editingId !== null ? "Cập nhật sân bay" : "Thêm sân bay"}</h2>
              <p>
                {editingId !== null
                  ? `Đang chỉnh sửa sân bay mã #${editingId}`
                  : "Nhập thông tin để thêm sân bay mới vào hệ thống."}
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                className="airport-button airport-button-light"
                onClick={resetForm}
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="airport-form">
            <div className="airport-form-grid">
              <div className="airport-field">
                <label htmlFor="MaIATA">Mã IATA</label>
                <input
                  id="MaIATA"
                  name="MaIATA"
                  value={form.MaIATA}
                  onChange={handleChange}
                  maxLength={3}
                  placeholder="Ví dụ: SGN"
                  required
                />
                {getFieldError("MaIATA") && (
                  <small>{getFieldError("MaIATA")}</small>
                )}
              </div>

              <div className="airport-field">
                <label htmlFor="TenSanBay">Tên sân bay</label>
                <input
                  id="TenSanBay"
                  name="TenSanBay"
                  value={form.TenSanBay}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="Nhập tên sân bay"
                  required
                />
                {getFieldError("TenSanBay") && (
                  <small>{getFieldError("TenSanBay")}</small>
                )}
              </div>

              <div className="airport-field">
                <label htmlFor="ThanhPho">Thành phố</label>
                <input
                  id="ThanhPho"
                  name="ThanhPho"
                  value={form.ThanhPho}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Nhập thành phố"
                  required
                />
                {getFieldError("ThanhPho") && (
                  <small>{getFieldError("ThanhPho")}</small>
                )}
              </div>

              <div className="airport-field">
                <label htmlFor="QuocGia">Quốc gia</label>
                <input
                  id="QuocGia"
                  name="QuocGia"
                  value={form.QuocGia}
                  onChange={handleChange}
                  maxLength={60}
                  placeholder="Nhập quốc gia"
                  required
                />
                {getFieldError("QuocGia") && (
                  <small>{getFieldError("QuocGia")}</small>
                )}
              </div>
            </div>

            <div className="airport-form-actions">
              <button
                type="submit"
                className="airport-button airport-button-primary"
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : editingId !== null
                    ? "Lưu thay đổi"
                    : "+ Thêm sân bay"}
              </button>

              <button
                type="button"
                className="airport-button airport-button-light"
                onClick={resetForm}
              >
                Làm mới
              </button>
            </div>
          </form>
        </section>

        <section className="airport-panel airport-list-panel">
          <div className="airport-list-heading">
            <div>
              <h2>Danh sách sân bay</h2>
              <p>Thông tin sân bay được lấy trực tiếp từ cơ sở dữ liệu.</p>
            </div>

            <div className="airport-total">
              <strong>{airports.length}</strong>
              <span>Tổng sân bay</span>
            </div>
          </div>

          <div className="airport-toolbar">
            <div className="airport-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo mã IATA, tên sân bay, thành phố..."
                aria-label="Tìm kiếm sân bay"
              />
            </div>

            <button
              type="button"
              className="airport-button airport-button-light"
              onClick={fetchAirports}
              disabled={loading}
            >
              ↻ Làm mới danh sách
            </button>
          </div>

          <div className="airport-table-wrapper">
            <table className="airport-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Mã IATA</th>
                  <th>Tên sân bay</th>
                  <th>Thành phố</th>
                  <th>Quốc gia</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="airport-empty">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredAirports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="airport-empty">
                      {keyword
                        ? "Không tìm thấy sân bay phù hợp."
                        : "Chưa có dữ liệu sân bay."}
                    </td>
                  </tr>
                ) : (
                  filteredAirports.map((airport) => (
                    <tr key={airport.MaSanBay}>
                      <td>#{airport.MaSanBay}</td>
                      <td>
                        <span className="airport-iata">
                          {airport.MaIATA.trim()}
                        </span>
                      </td>
                      <td className="airport-name">{airport.TenSanBay}</td>
                      <td>{airport.ThanhPho}</td>
                      <td>{airport.QuocGia}</td>
                      <td>
                        <div className="airport-row-actions">
                          <button
                            type="button"
                            className="airport-action-edit"
                            onClick={() => handleEdit(airport)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="airport-action-delete"
                            onClick={() => handleDelete(airport)}
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

          <div className="airport-table-footer">
            Hiển thị {filteredAirports.length} / {airports.length} sân bay
          </div>
        </section>
      </main>
    </div>
  );
}

export default AirportManagement;
