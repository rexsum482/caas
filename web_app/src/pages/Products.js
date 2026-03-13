import React, { useEffect, useState } from "react";
import api from "../components/axios";

import {
  Card,
  Typography,
  Row,
  Col,
  Spin,
  Tag,
  Empty,
  Input,
  Select,
  Button,
  Modal,
  Pagination,
  message
} from "antd";

import {
  ShoppingCartOutlined,
  EyeOutlined
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function Products() {

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [sort, setSort] = useState("");

  const [page, setPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const pageSize = 8;

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/");
      setProducts(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {

    let data = [...products];

    if (search) {
      data = data.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (sort === "price_low") {
      data.sort((a, b) => a.price - b.price);
    }

    if (sort === "price_high") {
      data.sort((a, b) => b.price - a.price);
    }

    if (sort === "newest") {
      data.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    setFiltered(data);
    setPage(1);

  }, [search, sort, products]);

  const addToCart = async (product) => {

    try {

      await api.post("/cart/", {
        product_id: product.id,
        quantity: 1
      });

      message.success(`${product.name} added to cart`);

    } catch (err) {

      message.error("Failed to add to cart");

    }
  };

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (loading) {

    return (
      <div className="flex justify-center items-center h-[300px]">
        <Spin size="large" />
      </div>
    );

  }

  if (!products.length) {

    return (
      <div className="flex justify-center mt-20">
        <Empty description="No products available" />
      </div>
    );

  }

  return (

    <div className="max-w-7xl mx-auto px-6 py-10">

      <Title level={2} className="mb-6">
        Store
      </Title>

      {/* Toolbar */}

      <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">

        <Search
          placeholder="Search products..."
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <Select
          placeholder="Sort"
          onChange={setSort}
          className="w-[200px]"
          allowClear
        >
          <Option value="price_low">Price: Low → High</Option>
          <Option value="price_high">Price: High → Low</Option>
          <Option value="newest">Newest</Option>
        </Select>

      </div>

      {/* Product Grid */}

      <Row gutter={[24, 24]}>

        {paginated.map((product) => {

          const primaryImage =
            product.images?.find((img) => img.is_primary) ||
            product.images?.[0];

          return (

            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>

              <Card
                hoverable
                className="rounded-xl shadow-sm hover:shadow-lg transition-all"
                cover={
                  primaryImage ? (
                    <img
                      src={primaryImage.image}
                      alt={primaryImage.alt || product.name}
                      className="h-[200px] w-full object-cover"
                    />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center bg-gray-100">
                      No Image
                    </div>
                  )
                }
              >

                <Title level={5} className="mb-1">
                  {product.name}
                </Title>

                <Paragraph
                  ellipsis={{ rows: 2 }}
                  className="text-gray-500"
                >
                  {product.description}
                </Paragraph>

                <div className="flex justify-between items-center mb-4">

                  <Text strong className="text-lg">
                    ${product.price}
                  </Text>

                  {product.track_inventory && (
                    product.stock > 0 ?
                      <Tag color="green">
                        In Stock ({product.stock})
                      </Tag>
                      :
                      <Tag color="red">
                        Out
                      </Tag>
                  )}

                </div>

                <div className="flex gap-2">

                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    block
                    disabled={
                      product.track_inventory &&
                      product.stock === 0
                    }
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </Button>

                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => setSelectedProduct(product)}
                  />

                </div>

              </Card>

            </Col>

          );

        })}

      </Row>

      {/* Pagination */}

      <div className="flex justify-center mt-10">

        <Pagination
          current={page}
          pageSize={pageSize}
          total={filtered.length}
          onChange={(p) => setPage(p)}
        />

      </div>

      {/* Product Detail Modal */}

      <Modal
        open={!!selectedProduct}
        footer={null}
        onCancel={() => setSelectedProduct(null)}
        width={700}
      >

        {selectedProduct && (

          <div>

            <Title level={3}>
              {selectedProduct.name}
            </Title>

            {selectedProduct.images?.length > 0 && (
              <img
                src={selectedProduct.images[0].image}
                alt=""
                className="w-full rounded mb-4"
              />
            )}

            <Paragraph>
              {selectedProduct.description}
            </Paragraph>

            <Text strong className="text-xl">
              ${selectedProduct.price}
            </Text>

            <div className="mt-4">

              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => addToCart(selectedProduct)}
              >
                Add to Cart
              </Button>

            </div>

          </div>

        )}

      </Modal>

    </div>

  );

}