import React, { useEffect, useState } from "react";
import api from "../components/axios";

import {
  Card,
  Table,
  Form,
  Input,
  InputNumber,
  Button,
  Switch,
  Space,
  Typography,
  Popconfirm,
  Modal,
  Tag,
  Upload,
  Image,
  Radio,
  message,
} from "antd";

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

export default function MyProducts() {
  const [pendingImages, setPendingImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [form] = Form.useForm();

  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProducts = async () => {
    const res = await api.get("/products/");
    setProducts(res.data);
  };

  const fetchImages = async (productId) => {
    const res = await api.get(`/products/${productId}/images/`);
    setImages(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

const openCreateModal = () => {
    setEditingId(null);
    setImages([]);
    setPendingImages([]);
    form.resetFields();
    form.setFieldsValue({
      track_inventory: true,
      active: true,
    });
    setModalOpen(true);
  };

  const editProduct = async (product) => {
    setEditingId(product.id);
    form.setFieldsValue(product);
    await fetchImages(product.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setImages([]);
    form.resetFields();
  };

const handleSubmit = async (values) => {

  try {

    let productId = editingId;

    if (editingId) {

      await api.put(`/products/${editingId}/`, values);
      message.success("Product updated");

    } else {

      const res = await api.post("/products/", values);
      productId = res.data.id;
      message.success("Product created");

      // Upload queued images
      for (const file of pendingImages) {

        const formData = new FormData();
        formData.append("image", file);

        await api.post(`/products/${productId}/images/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

      }

      setPendingImages([]);
    }

    closeModal();
    fetchProducts();

  } catch (err) {
    console.error(err);
    message.error("Save failed");
  }
};

  const deleteProduct = async (id) => {

    try {
      await api.delete(`/products/${id}/`);
      message.success("Product deleted");
      fetchProducts();
    } catch {
      message.error("Delete failed");
    }
  };

  const uploadImage = async (file) => {

    if (!editingId) {

      // Product not created yet — store locally
      setPendingImages((prev) => [...prev, file]);
      message.success("Image queued for upload");

      return false;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {

      await api.post(`/products/${editingId}/images/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchImages(editingId);
      message.success("Image uploaded");

    } catch {
      message.error("Upload failed");
    }

    return false;
  };

  const setPrimary = async (imageId) => {

    try {

      await api.patch(
        `/products/${editingId}/images/${imageId}/`,
        { is_primary: true }
      );

      fetchImages(editingId);

    } catch {
      message.error("Failed to set default image");
    }
  };

  const deleteImage = async (imageId) => {

    try {

      await api.delete(`/products/${editingId}/images/${imageId}/`);
      fetchImages(editingId);

    } catch {
      message.error("Delete failed");
    }
  };

  const columns = [

    {
      title: "Image",
      render: (_, record) => {

        const primary = record.images?.find(i => i.is_primary);

        return primary ? (
          <Image
            src={primary.image}
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          "-"
        );
      },
    },

    {
      title: "Product",
      dataIndex: "name",
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-gray-400 text-xs">{record.sku}</div>
        </div>
      ),
    },

    {
      title: "Price",
      dataIndex: "price",
      render: (p) => `$${p}`,
    },

    { title: "Stock", dataIndex: "stock" },

    {
      title: "Inventory",
      dataIndex: "track_inventory",
      render: (v) =>
        v ? <Tag color="blue">Tracked</Tag> : <Tag>Not Tracked</Tag>,
    },

    {
      title: "Status",
      dataIndex: "active",
      render: (v) =>
        v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },

    {
      title: "Actions",
      render: (_, record) => (
        <Space>

          <Button
            icon={<EditOutlined />}
            onClick={() => editProduct(record)}
          />

          <Popconfirm
            title="Delete this product?"
            onConfirm={() => deleteProduct(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>

        </Space>
      ),
    },
  ];

  return (

    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <div className="flex justify-between items-center">

        <Title level={2} className="!mb-0">
          Products
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={openCreateModal}
        >
          Add Product
        </Button>

      </div>

      <Card className="shadow-sm">

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />

      </Card>

      <Modal
        title={editingId ? "Edit Product" : "Create Product"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        width={720}
      >

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >

          <Form.Item
            label="Product Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="SKU"
            name="sku"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">

            <Form.Item label="Price" name="price">
              <InputNumber className="w-full" min={0} step={0.01} />
            </Form.Item>

            <Form.Item label="Stock" name="stock">
              <InputNumber className="w-full" min={0} />
            </Form.Item>

          </div>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} />
          </Form.Item>

          <div className="flex gap-8">

            <Form.Item
              label="Track Inventory"
              name="track_inventory"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Active"
              name="active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

          </div>

          { (

<div className="mt-6">

  <Title level={5}>Product Images</Title>

  <Upload.Dragger
    beforeUpload={uploadImage}
    multiple
    showUploadList={false}
  >
    <p className="ant-upload-drag-icon">
      <UploadOutlined />
    </p>

    <p>Click or drag images to upload</p>
  </Upload.Dragger>

  {/* Pending Images (before product save) */}
  {!editingId && pendingImages.length > 0 && (

    <div className="grid grid-cols-4 gap-4 mt-4">

      {pendingImages.map((file, index) => (

        <div key={index} className="border rounded-lg p-2">

          <Image
            src={URL.createObjectURL(file)}
            className="h-28 object-cover w-full"
          />

        </div>

      ))}

    </div>

  )}

  {/* Existing Images (after save) */}
  { editingId && (

    <div className="grid grid-cols-4 gap-4 mt-4">

      {images.map((img) => (

        <div
          key={img.id}
          className={`border rounded-lg p-2 ${
            img.is_primary ? "border-blue-500" : ""
          }`}
        >

          <Image
            src={img.image}
            className="h-28 object-cover w-full"
          />

          <div className="flex justify-between mt-2">

            <Radio
              checked={img.is_primary}
              onChange={() => setPrimary(img.id)}
            >
              Default
            </Radio>

            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteImage(img.id)}
            />

          </div>

        </div>

      ))}

    </div>

  )}

</div>

          )}

          <div className="flex justify-end gap-2 mt-6">

            <Button onClick={closeModal}>
              Cancel
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
            >
              {editingId ? "Update Product" : "Create Product"}
            </Button>

          </div>

        </Form>

      </Modal>

    </div>
  );
}
