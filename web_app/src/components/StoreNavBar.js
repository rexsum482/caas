import { Layout, Input, Badge, Button } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useCart } from "../context/CartContext";

const { Header } = Layout;
const { Search } = Input;

export default function StoreNavbar({ onCartClick }) {

  const { cart } = useCart();

  return (
    <Header className="flex justify-between items-center bg-white shadow px-6">

      <h2 className="text-xl font-semibold">
        My Store
      </h2>

      <Search
        placeholder="Search products"
        className="max-w-md"
      />

      <Badge count={cart.length}>
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={onCartClick}
        >
          Cart
        </Button>
      </Badge>

    </Header>
  );
}