import { Card, Button, Tag } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, onView }) {

  const { addToCart } = useCart();

  const primaryImage =
    product.images?.find((img) => img.is_primary) ||
    product.images?.[0];

  return (

    <Card
      hoverable
      className="rounded-xl"
      cover={
        primaryImage &&
        <img
          src={primaryImage.image}
          alt={product.name}
          className="h-[200px] object-cover"
        />
      }
    >

      <h3 className="font-semibold">
        {product.name}
      </h3>

      <p className="text-gray-500 line-clamp-2">
        {product.description}
      </p>

      <div className="flex justify-between items-center mt-3">

        <strong>${product.price}</strong>

        {product.track_inventory &&
          (product.stock > 0
            ? <Tag color="green">In Stock</Tag>
            : <Tag color="red">Out</Tag>)}

      </div>

      <div className="flex gap-2 mt-4">

        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => addToCart(product)}
          block
        >
          Add
        </Button>

        <Button onClick={() => onView(product)}>
          View
        </Button>

      </div>

    </Card>

  );
}