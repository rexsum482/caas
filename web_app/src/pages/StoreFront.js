import { useEffect, useState } from "react";
import api from "../components/axios";

import { Row, Col, Spin, Modal } from "antd";

import ProductCard from "../components/ProductCard";
import StoreNavbar from "../components/StoreNavbar";
import CartDrawer from "../components/CartDrawer";

export default function Storefront() {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cartOpen, setCartOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);

  const loadProducts = async () => {

    const res = await api.get("/products/");
    setProducts(res.data);

    setLoading(false);

  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center mt-20">
        <Spin size="large"/>
      </div>
    );

  return (

    <div>

      <StoreNavbar
        openCart={() => setCartOpen(true)}
      />

      <div className="max-w-7xl mx-auto p-8">

        <Row gutter={[24,24]}>

          {products.map(p => (

            <Col xs={24} sm={12} md={8} lg={6} key={p.id}>

              <ProductCard
                product={p}
                view={setViewProduct}
              />

            </Col>

          ))}

        </Row>

      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      <Modal
        open={!!viewProduct}
        onCancel={() => setViewProduct(null)}
        footer={null}
      >

        {viewProduct && (

          <div>

            <h2 className="text-xl font-bold">
              {viewProduct.name}
            </h2>

            <p className="mt-3">
              {viewProduct.description}
            </p>

            <h3 className="text-lg font-semibold mt-4">
              ${viewProduct.price}
            </h3>

          </div>

        )}

      </Modal>

    </div>
  );
}