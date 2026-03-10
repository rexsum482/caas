import React, { useEffect, useState } from "react";
import api from "../components/axios";

export default function MyProducts() {
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    stock: "",
    track_inventory: true,
    active: true,
  });

  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    const res = await api.get("/products/");
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      sku: "",
      description: "",
      price: "",
      stock: "",
      track_inventory: true,
      active: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`/products/${editingId}/`, form);
      } else {
        await api.post("/products/", form);
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm(product);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    await api.delete(`/products/${id}/`);
    fetchProducts();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Products</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="sku"
          placeholder="SKU"
          value={form.sku}
          onChange={handleChange}
          required
        />

        <input
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          type="number"
          step="0.01"
        />

        <input
          name="stock"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
          type="number"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        <label>
          Track Inventory
          <input
            type="checkbox"
            name="track_inventory"
            checked={form.track_inventory}
            onChange={handleChange}
          />
        </label>

        <label>
          Active
          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
          />
        </label>

        <button type="submit">
          {editingId ? "Update Product" : "Create Product"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      <h3>Existing Products</h3>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.sku}</td>
              <td>${product.price}</td>
              <td>{product.stock}</td>
              <td>{product.active ? "Yes" : "No"}</td>

              <td>
                <button onClick={() => editProduct(product)}>Edit</button>

                <button onClick={() => deleteProduct(product.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}