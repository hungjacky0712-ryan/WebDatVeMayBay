
import { useCallback, useEffect, useMemo, useState } from "react";
import "./AircraftManagement.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const AIRCRAFT_API = `${API_BASE_URL}/api/maybay`;
const AIRLINE_API = `${API_BASE_URL}/api/hanghangkhong`;

const EMPTY_FORM = {
  MaHang: "",
  DongMay: "",
  SoDangKy: "",
  TongSoGhe: "",
};

function getAuthHeaders() {
  const token = sessionStorage.getItem("admin_token");

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function AircraftManagement() {
  const [aircraft, setAircraft] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [alert, setAlert] = useState({
    type: "",
    message: "",
  });

  const [errors, setErrors] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [aircraftResponse, airlineResponse] = await Promise.all([
        fetch(AIRCRAFT_API, {
          headers: getAuthHeaders(),
        }),
        fetch(AIRLINE_API, {
          headers: getAuthHeaders(),
        }),
      ]);

      const aircraftData = await readResponse(aircraftResponse);
      const airlineData = await readResponse(airlineResponse);

      if (!aircraftResponse.ok) {
        throw new Error(
          aircraftData.message || "Không thể tải danh sách máy bay."
        );
      }

      if (!airlineResponse.ok) {
        throw new Error(
          airlineData.message || "Không thể tải danh sách hãng hàng không."
        );
      }

      setAircraft(aircraftData.data || []);
      setAirlines(airlineData.data || []);
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Không thể kết nối máy chủ.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAircraft = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return aircraft;

    return aircraft.filter((item) =>
      [
        item.MaMayBay,
        item.MaHang,
        item.DongMay,
        item.SoDangKy,
        item.TongSoGhe,
        item.TenHang,
        item.MaIATA,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [aircraft, search]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
  };

  const handleEdit = (item) => {
    setEditingId(item.MaMayBay);

    setForm({
      MaHang: String(item.MaHang ?? ""),
      DongMay: item.DongMay ?? "",
      SoDangKy: item.SoDangKy ?? "",
      TongSoGhe: String(item.TongSoGhe ?? ""),
    });

    setErrors({});
    setAlert({ type: "", message: "" });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleUnauthorized = () => {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");

    setAlert({
      type: "error",
      message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setAlert({ type: "", message: "" });
    setErrors({});

    const newErrors = {};

    if (!form.MaHang) {
      newErrors.MaHang = "Vui lòng chọn hãng hàng không.";
    }

    if (!form.DongMay.trim()) {
      newErrors.DongMay = "Vui lòng nhập dòng máy bay.";
    }

    if (!form.SoDangKy.trim()) {
      newErrors.SoDangKy = "Vui lòng nhập số đăng ký.";
    }

    if (!form.TongSoGhe || Number(form.TongSoGhe) < 1) {
      newErrors.TongSoGhe = "Tổng số ghế phải lớn hơn 0.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const token = sessionStorage.getItem("admin_token");

    if (!token) {
      setAlert({
        type: "error",
        message: "Bạn cần đăng nhập tài khoản quản trị.",
      });
      return;
    }

    const payload = {
      MaHang: Number(form.MaHang),
      DongMay: form.DongMay.trim(),
      SoDangKy: form.SoDangKy.trim(),
      TongSoGhe: Number(form.TongSoGhe),
    };

    const isEditing = editingId !== null;

    const url = isEditing
      ? `${AIRCRAFT_API}/${editingId}`
      : AIRCRAFT_API;

    setSubmitting(true);

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const result = await readResponse(response);

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (response.status === 422) {
        setErrors(result.errors || {});
        setAlert({
          type: "error",
          message: result.message || "Dữ liệu chưa hợp lệ.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Không thể ${isEditing ? "cập nhật" : "thêm"} máy bay.`
        );
      }

      setAlert({
        type: "success",
        message: isEditing
          ? "Cập nhật máy bay thành công."
          : "Thêm máy bay thành công.",
      });

      resetForm();
      await fetchData();
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Có lỗi xảy ra.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa máy bay mã ${id}?`
    );

    if (!confirmed) return;

    const token = sessionStorage.getItem("admin_token");

    if (!token) {
      setAlert({
        type: "error",
        message: "Bạn cần đăng nhập tài khoản quản trị.",
      });
      return;
    }

    setAlert({ type: "", message: "" });

    try {
      const response = await fetch(`${AIRCRAFT_API}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const result = await readResponse(response);

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Không thể xóa máy bay."
        );
      }

      if (editingId === id) {
        resetForm();
      }

      setAlert({
        type: "success",
        message: "Xóa máy bay thành công.",
      });

      await fetchData();
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Có lỗi xảy ra khi xóa.",
      });
    }
  };

  return (
    <div className="aircraft-management">
      <header className="aircraft-header">
        <div>
          <span className="aircraft-header-label">
            HỆ THỐNG QUẢN TRỊ
          </span>

          <h1>Quản lý máy bay</h1>

          <p>
            Quản lý thông tin máy bay và hãng hàng không trong hệ thống.
          </p>
        </div>

        <div className="aircraft-header-icon">✈</div>
      </header>

      <main className="aircraft-content">
        {alert.message && (
          <div
            className={`aircraft-alert aircraft-alert-${alert.type}`}
            role="alert"
          >
            <span>{alert.message}</span>

            <button
              type="button"
              onClick={() => setAlert({ type: "", message: "" })}
            >
              ×
            </button>
          </div>
        )}

        <section className="aircraft-panel">
          <div className="aircraft-panel-heading">
            <div>
              <h2>
                {editingId !== null
                  ? "Cập nhật thông tin máy bay"
                  : "Thêm máy bay mới"}
              </h2>

              <p>
                Nhập đầy đủ thông tin máy bay bên dưới.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="aircraft-form-grid">
              <div className="aircraft-field">
                <label htmlFor="MaHang">Hãng hàng không *</label>

                <select
                  id="MaHang"
                  name="MaHang"
                  value={form.MaHang}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">-- Chọn hãng hàng không --</option>

                  {airlines.map((airline) => (
                    <option
                      key={airline.MaHang}
                      value={airline.MaHang}
                    >
                      {airline.TenHang} ({airline.MaIATA})
                    </option>
                  ))}
                </select>

                {errors.MaHang && <small>{errors.MaHang}</small>}
              </div>

              <div className="aircraft-field">
                <label htmlFor="DongMay">Dòng máy bay *</label>

                <input
                  id="DongMay"
                  name="DongMay"
                  type="text"
                  placeholder="Ví dụ: Airbus A321"
                  value={form.DongMay}
                  onChange={handleChange}
                  disabled={submitting}
                />

                {errors.DongMay && <small>{errors.DongMay}</small>}
              </div>

              <div className="aircraft-field">
                <label htmlFor="SoDangKy">Số đăng ký *</label>

                <input
                  id="SoDangKy"
                  name="SoDangKy"
                  type="text"
                  placeholder="Ví dụ: VN-A321"
                  value={form.SoDangKy}
                  onChange={handleChange}
                  disabled={submitting}
                />

                {errors.SoDangKy && <small>{errors.SoDangKy}</small>}
              </div>

              <div className="aircraft-field">
                <label htmlFor="TongSoGhe">Tổng số ghế *</label>

                <input
                  id="TongSoGhe"
                  name="TongSoGhe"
                  type="number"
                  min="1"
                  placeholder="Ví dụ: 180"
                  value={form.TongSoGhe}
                  onChange={handleChange}
                  disabled={submitting}
                />

                {errors.TongSoGhe && (
                  <small>{errors.TongSoGhe}</small>
                )}
              </div>
            </div>

            <div className="aircraft-form-actions">
              <button
                type="submit"
                className="aircraft-button aircraft-button-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Đang xử lý..."
                  : editingId !== null
                    ? "Cập nhật máy bay"
                    : "Thêm máy bay"}
              </button>

              <button
                type="button"
                className="aircraft-button aircraft-button-light"
                onClick={resetForm}
                disabled={submitting}
              >
                Làm mới
              </button>
            </div>
          </form>
        </section>

        <section className="aircraft-panel">
          <div className="aircraft-list-heading">
            <div>
              <h2>Danh sách máy bay</h2>

              <p>
                Tra cứu và quản lý các máy bay hiện có.
              </p>
            </div>

            <div className="aircraft-total">
              <strong>{aircraft.length}</strong>
              <span>Tổng máy bay</span>
            </div>
          </div>

          <div className="aircraft-toolbar">
            <div className="aircraft-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Tìm theo mã, dòng máy, số đăng ký hoặc hãng..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <button
              type="button"
              className="aircraft-button aircraft-button-light"
              onClick={fetchData}
              disabled={loading}
            >
              ↻ Làm mới dữ liệu
            </button>
          </div>

          <div className="aircraft-table-wrapper">
            <table className="aircraft-table">
              <thead>
                <tr>
                  <th>Mã máy bay</th>
                  <th>Hãng hàng không</th>
                  <th>Dòng máy</th>
                  <th>Số đăng ký</th>
                  <th>Tổng số ghế</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="aircraft-empty">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredAircraft.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="aircraft-empty">
                      Không tìm thấy máy bay phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredAircraft.map((item) => (
                    <tr key={item.MaMayBay}>
                      <td>#{item.MaMayBay}</td>

                      <td>
                        <div className="aircraft-name">
                          {item.TenHang || `Hãng ${item.MaHang}`}
                        </div>
                        <span className="aircraft-iata">
                          {item.MaIATA || "--"}
                        </span>
                      </td>

                      <td className="aircraft-model">
                        {item.DongMay}
                      </td>

                      <td>{item.SoDangKy}</td>

                      <td>
                        <span className="aircraft-seats">
                          {item.TongSoGhe} ghế
                        </span>
                      </td>

                      <td>
                        <div className="aircraft-row-actions">
                          <button
                            type="button"
                            className="aircraft-action-edit"
                            onClick={() => handleEdit(item)}
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="aircraft-action-delete"
                            onClick={() => handleDelete(item.MaMayBay)}
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

          <div className="aircraft-table-footer">
            Hiển thị {filteredAircraft.length} / {aircraft.length} máy bay
          </div>
        </section>
      </main>
    </div>
  );
}
