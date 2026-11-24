import { useCallback, useEffect, useState } from "react";
import "./PassengerManagement.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const emptyForm = {
  MaNguoiDung: "",
  HoTen: "",
  CCCD: "",
  NgaySinh: "",
  GioiTinh: "",
  QuocTich: "",
};

function PassengerManagement() {
  const [passengers, setPassengers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem("admin_token") || ""}`,
  });

  const loadPassengers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/hanhkhach`, {
        headers: getHeaders(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Không tải được danh sách hành khách.");
      setPassengers(Array.isArray(result) ? result : (result.data || []));
    } catch (err) {
      setError(err.message || "Có lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPassengers();
  }, [loadPassengers]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      MaNguoiDung: form.MaNguoiDung === "" ? null : Number(form.MaNguoiDung),
      HoTen: form.HoTen.trim(),
      CCCD: form.CCCD.trim(),
      NgaySinh: form.NgaySinh || null,
      GioiTinh: form.GioiTinh || null,
      QuocTich: form.QuocTich.trim(),
    };

    try {
      const url = editingId
        ? `${API_BASE_URL}/api/hanhkhach/${editingId}`
        : `${API_BASE_URL}/api/hanhkhach`;
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        const validation = result.errors
          ? Object.values(result.errors).flat().join(" ")
          : result.message;
        throw new Error(validation || "Không thể lưu hành khách.");
      }
      setMessage(result.message || (editingId ? "Cập nhật hành khách thành công." : "Thêm hành khách thành công."));
      resetForm();
      await loadPassengers();
    } catch (err) {
      setError(err.message || "Có lỗi khi lưu dữ liệu.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (passenger) => {
    setEditingId(passenger.MaHanhKhach);
    setForm({
      MaNguoiDung: passenger.MaNguoiDung ?? "",
      HoTen: passenger.HoTen ?? "",
      CCCD: passenger.CCCD ?? "",
      NgaySinh: passenger.NgaySinh ? String(passenger.NgaySinh).slice(0, 10) : "",
      GioiTinh: passenger.GioiTinh ?? "",
      QuocTich: passenger.QuocTich ?? "",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hành khách mã ${id}?`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/hanhkhach/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Không thể xóa hành khách.");
      setMessage(result.message || "Xóa hành khách thành công.");
      await loadPassengers();
    } catch (err) {
      setError(err.message || "Có lỗi khi xóa dữ liệu.");
    }
  };

  return (
    <main className="passenger-page">
      <div className="passenger-container">
        <div className="passenger-heading">
          <div>
            <p className="passenger-eyebrow">HỆ THỐNG ĐẶT VÉ MÁY BAY</p>
            <h1>Quản lý hành khách</h1>
            <p className="passenger-subtitle">Quản lý thông tin và hồ sơ hành khách.</p>
          </div>
          <button className="passenger-button passenger-button-light" onClick={loadPassengers} disabled={loading}>
            ↻ Làm mới
          </button>
        </div>

        {message && <div className="passenger-alert passenger-alert-success">{message}</div>}
        {error && <div className="passenger-alert passenger-alert-error">{error}</div>}

        <section className="passenger-panel">
          <div className="passenger-panel-title">
            <h2>{editingId ? `Cập nhật hành khách #${editingId}` : "Thêm hành khách"}</h2>
            {editingId && <button className="passenger-text-button" type="button" onClick={resetForm}>Hủy chỉnh sửa</button>}
          </div>
          <form className="passenger-form" onSubmit={handleSubmit}>
            <label>
              Mã người dùng
              <input name="MaNguoiDung" type="number" min="1" value={form.MaNguoiDung} onChange={handleChange} placeholder="Có thể để trống" />
            </label>
            <label>
              Họ và tên *
              <input name="HoTen" value={form.HoTen} onChange={handleChange} required maxLength="200" placeholder="Nhập họ và tên" />
            </label>
            <label>
              CCCD *
              <input name="CCCD" value={form.CCCD} onChange={handleChange} required maxLength="20" placeholder="Nhập số CCCD" />
            </label>
            <label>
              Ngày sinh
              <input name="NgaySinh" type="date" value={form.NgaySinh} onChange={handleChange} />
            </label>
            <label>
              Giới tính
              <select name="GioiTinh" value={form.GioiTinh} onChange={handleChange}>
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </label>
            <label>
              Quốc tịch *
              <input name="QuocTich" value={form.QuocTich} onChange={handleChange} required maxLength="100" placeholder="Ví dụ: Việt Nam" />
            </label>
            <div className="passenger-form-actions">
              <button className="passenger-button passenger-button-primary" type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "+ Thêm hành khách"}
              </button>
              <button className="passenger-button passenger-button-light" type="button" onClick={resetForm}>Nhập lại</button>
            </div>
          </form>
        </section>

        <section className="passenger-panel">
          <div className="passenger-panel-title">
            <div>
              <h2>Danh sách hành khách</h2>
              <p className="passenger-count">{passengers.length} hành khách</p>
            </div>
          </div>
          <div className="passenger-table-wrap">
            <table className="passenger-table">
              <thead>
  <tr>
    <th>STT</th>
    <th>Mã HK</th>
    <th>Mã người dùng</th>
    <th>Họ tên</th>
    <th>CCCD</th>
    <th>Ngày sinh</th>
    <th>Giới tính</th>
    <th>Quốc tịch</th>
    <th>Thao tác</th>
  </tr>
</thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="passenger-empty">Đang tải dữ liệu...</td></tr>
                ) : passengers.length === 0 ? (
                  <tr><td colSpan="" className="passenger-empty">Chưa có dữ liệu hành khách.</td></tr>
                ) : passengers.map((item,index) => (
                  <tr key={item.MaHanhKhach}>
                    <td>{index + 1}</td>
                    <td>{item.MaHanhKhach}</td>
                    <td>{item.MaNguoiDung ?? "—"}</td>
                    <td className="passenger-name">{item.HoTen}</td>
                    <td>{item.CCCD}</td>
                    <td>{item.NgaySinh ? String(item.NgaySinh).slice(0, 10) : "—"}</td>
                    <td>{item.GioiTinh || "—"}</td>
                    <td>{item.QuocTich || "—"}</td>
                    <td>
                      <div className="passenger-row-actions">
                        <button className="passenger-action-edit" onClick={() => handleEdit(item)}>Sửa</button>
                        <button className="passenger-action-delete" onClick={() => handleDelete(item.MaHanhKhach)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default PassengerManagement;
