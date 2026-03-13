import { Card, Button, Tag } from "antd";
import { ShoppingCartOutlined, EyeOutlined } from "@ant-design/icons";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, onView }) {

  const { addToCart } = useCart();

  const primaryImage =
    product.images?.find((img) => img.is_primary) ||
    product.images?.[0];

  return (
    <Card
      bordered
      className="rounded-xl overflow-hidden border-gray-200 transition-all duration-200 hover:shadow-lg"
      bodyStyle={{ padding: "16px" }}
      cover={
        primaryImage && (
          <div className="h-[200px] overflow-hidden bg-gray-100">
            <img
              src={primaryImage.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )
      }
    >

      {/* Product Title */}
      <div className="space-y-1">
        <h3 className="font-semibold text-base leading-tight">
          {product.name}
        </h3>

        <p className="text-gray-500 text-sm line-clamp-2">
          {product.description}
        </p>
      </div>

      {/* Price + Inventory */}
      <div className="flex justify-between items-center mt-4">

        <span className="text-lg font-semibold">
          ${product.price}
        </span>

        {product.track_inventory &&
          (product.stock > 0
            ? <Tag color="green">In Stock</Tag>
            : <Tag color="red">Out of Stock</Tag>)
        }

      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-5">

        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => addToCart(product)}
          className="flex-1"
        >
          Add
        </Button>

        <Button
          icon={<EyeOutlined />}
          onClick={() => onView(product)}
        >
          View
        </Button>

      </div>

    </Card>
  );
}
