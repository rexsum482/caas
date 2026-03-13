import { Drawer, List, Button } from "antd";
import { useCart } from "../context/CartContext";

export default function CartDrawer({ open, onClose }) {

  const { cart, removeFromCart } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (

    <Drawer
      title="Shopping Cart"
      open={open}
      onClose={onClose}
      width={400}
    >

      <List
        dataSource={cart}
        renderItem={(item) => (

          <List.Item
            actions={[
              <Button
                danger
                onClick={() => removeFromCart(item.id)}
              >
                Remove
              </Button>
            ]}
          >

            <List.Item.Meta
              title={item.product.name}
              description={`Qty: ${item.quantity}`}
            />

            ${item.product.price}

          </List.Item>

        )}
      />

      <div className="mt-6 text-right">

        <h3>Total: ${total.toFixed(2)}</h3>

        <Button
          type="primary"
          block
          className="mt-2"
          href="/checkout"
        >
          Checkout
        </Button>

      </div>

    </Drawer>

  );
}