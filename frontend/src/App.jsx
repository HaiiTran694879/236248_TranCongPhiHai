
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/foods"
).replace(/\/+$/, "");

const emptyForm = {
  foodId: "",
  name: "",
  category: "",
  cuisine: "",
  ingredients: "",
  price: "",
  quantity: "",
  description: "",
  imageUrl: "",
};

function App() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const validationErrors = Array.isArray(data.errors)
        ? `: ${data.errors.join(", ")}`
        : "";
      throw new Error(
        `${data.message || data.error || `Lỗi HTTP ${response.status}`}${validationErrors}`
      );
    }

    return data;
  }

  async function fetchFoods(keyword = "") {
    const url = new URL(API_URL);
    if (keyword.trim()) {
      url.searchParams.set("search", keyword.trim());
    }

    const data = await request(url.toString());
    return Array.isArray(data) ? data : data.foods || [];
  }

  async function loadFoods(keyword = "", showLoading = true) {
    if (showLoading) {
      setLoading(true);
      setError("");
    }

    try {
      setFoods(await fetchFoods(keyword));
    } catch (err) {
      setError(`Không tải được danh sách: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadInitialFoods() {
      try {
        const initialFoods = await fetchFoods();
        if (active) setFoods(initialFoods);
      } catch (err) {
        if (active) setError(`Không tải được danh sách: ${err.message}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialFoods();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function showDetail(id) {
    setError("");
    setMessage("");
    setDetail(null);
    setDetailLoading(true);

    try {
      const food = await request(`${API_URL}/${id}`);
      setDetail(food);
    } catch (err) {
      setError(`Không xem được chi tiết: ${err.message}`);
    } finally {
      setDetailLoading(false);
    }
  }

  function startEdit(food) {
    setEditingId(food._id);
    setForm({
      foodId: food.foodId || "",
      name: food.name || "",
      category: food.category || "",
      cuisine: food.cuisine || "",
      ingredients: Array.isArray(food.ingredients)
        ? food.ingredients.join(", ")
        : "",
      price: food.price ?? "",
      quantity: food.quantity ?? "",
      description: food.description || "",
      imageUrl: food.imageUrl || "",
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
      ingredients: form.ingredients
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        const updatePayload = { ...payload };
        delete updatePayload.foodId;

        await request(`${API_URL}/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(updatePayload),
        });

        setMessage("Cập nhật món ăn thành công!");
      } else {
        await request(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage("Thêm món ăn thành công!");
      }

      resetForm();
      await loadFoods(search);
    } catch (err) {
      setError(`Thao tác thất bại: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteFood(food) {
    if (!window.confirm(`Bạn có chắc muốn xóa "${food.name}" không?`)) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(food._id);

    try {
      await request(`${API_URL}/${food._id}`, { method: "DELETE" });

      setMessage("Xóa món ăn thành công!");

      if (detail?._id === food._id) {
        setDetail(null);
      }

      await loadFoods(search);
    } catch (err) {
      setError(`Xóa thất bại: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadFoods(search);
  }

  return (
    <main className="container">
      <header className="page-header">
        <p className="eyebrow"><span /> QUẢN TRỊ THỰC ĐƠN</p>
        <h1>Quản lý món ăn</h1>
        <p>Theo dõi danh mục, giá bán và số lượng món ăn.</p>
      </header>

      {message && <div className="notice success" role="status">{message}</div>}
      {error && <div className="notice error" role="alert">{error}</div>}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">THÔNG TIN MÓN</p>
            <h2>{editingId ? "Cập nhật món ăn" : "Thêm món ăn mới"}</h2>
          </div>
          {editingId && <span className="editing-tag">Đang chỉnh sửa</span>}
        </div>

        <form className="food-form" onSubmit={handleSubmit}>
          <label>
            Mã món ăn *
            <input
              name="foodId"
              value={form.foodId}
              onChange={handleChange}
              required
              disabled={Boolean(editingId)}
            />
          </label>

          <label>
            Tên món ăn *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Loại món ăn *
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              placeholder="Món chính, khai vị..."
            />
          </label>

          <label>
            Ẩm thực *
            <input
              name="cuisine"
              value={form.cuisine}
              onChange={handleChange}
              required
              placeholder="Việt Nam, Nhật Bản..."
            />
          </label>

          <label>
            Giá (VNĐ) *
            <input
              name="price"
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Số lượng *
            <input
              name="quantity"
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </label>

          <label className="full-width">
            Nguyên liệu (cách nhau bằng dấu phẩy)
            <input
              name="ingredients"
              value={form.ingredients}
              onChange={handleChange}
              placeholder="Thịt bò, bún, hành"
            />
          </label>

          <label className="full-width">
            Đường dẫn hình ảnh
            <input
              name="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={handleChange}
            />
          </label>

          <label className="full-width">
            Mô tả
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
            />
          </label>

          <div className="form-actions full-width">
            <button type="submit" disabled={saving}>
              {saving
                ? "Đang lưu..."
                : editingId
                  ? "Lưu cập nhật"
                  : "Thêm món ăn"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={resetForm}
              >
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="section-label">THỰC ĐƠN</p>
            <h2>Danh sách món ăn</h2>
            <p className="result-count">{foods.length} món ăn</p>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên, loại hoặc ẩm thực..."
              aria-label="Từ khóa tìm kiếm"
            />

            <button type="submit" disabled={loading}>Tìm kiếm</button>

            <button
              type="button"
              className="secondary"
              disabled={loading && !search}
              onClick={() => {
                setSearch("");
                loadFoods("");
              }}
            >
              Xóa lọc
            </button>
          </form>
        </div>

        {loading ? (
          <p className="status" role="status">Đang tải danh sách món ăn...</p>
        ) : foods.length === 0 ? (
          <p className="status">
            {error.startsWith("Không tải được danh sách")
              ? "Danh sách chưa thể tải. Vui lòng thử lại."
              : "Không tìm thấy món ăn nào."}
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã món</th>
                  <th>Tên món</th>
                  <th>Loại</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {foods.map((food) => (
                  <tr key={food._id}>
                    <td>{food.foodId}</td>
                    <td>{food.name}</td>
                    <td>{food.category}</td>
                    <td>
                      {Number(food.price).toLocaleString("vi-VN")} đ
                    </td>
                    <td>{food.quantity}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="small"
                          onClick={() => showDetail(food._id)}
                        >
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          className="small secondary"
                          onClick={() => startEdit(food)}
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          className="small danger"
                          onClick={() => deleteFood(food)}
                          disabled={deletingId === food._id}
                        >
                          {deletingId === food._id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detail && (
        <section className="panel detail-panel">
          <div className="section-heading">
            <h2>Chi tiết món ăn</h2>
            <button
              type="button"
              className="secondary"
              onClick={() => setDetail(null)}
            >
              Đóng
            </button>
          </div>
          <div className="detail-copy">
            {detail.imageUrl && (
              <img src={detail.imageUrl} alt={`Món ${detail.name}`} />
            )}
            <div>
              <h3>{detail.name}</h3>
              <dl>
                <dt>Mã món</dt><dd>{detail.foodId}</dd>
                <dt>Loại món</dt><dd>{detail.category}</dd>
                <dt>Ẩm thực</dt><dd>{detail.cuisine || "Chưa cập nhật"}</dd>
                <dt>Giá bán</dt>
                <dd>{Number(detail.price).toLocaleString("vi-VN")} đ</dd>
                <dt>Số lượng</dt><dd>{detail.quantity}</dd>
                <dt>Nguyên liệu</dt>
                <dd>
                  {Array.isArray(detail.ingredients) && detail.ingredients.length
                    ? detail.ingredients.join(", ")
                    : "Chưa cập nhật"}
                </dd>
              </dl>
              <p className="detail-description">
                {detail.description || "Món ăn chưa có mô tả."}
              </p>
            </div>
          </div>
        </section>
      )}

      {detailLoading && (
        <section className="panel detail-panel" role="status">
          <p className="status">Đang tải thông tin món ăn...</p>
        </section>
      )}
    </main>
  );
}

export default App;
