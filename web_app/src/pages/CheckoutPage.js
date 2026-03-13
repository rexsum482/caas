import { useCart } from "../context/CartContext";
import { Form, Input, Button, Card } from "antd";
import api from "../components/axios";
import { message } from "antd";

export default function CheckoutPage() {

  const { cart } = useCart();

  const submitOrder = async (values) => {

    try {

      await api.post("/orders/", {
        shipping_address: values,
        billing_address: values
      });

      message.success("Order placed!");

      window.location = "/order-success";

    } catch {

      message.error("Checkout failed");

    }
  };

  return (

    <div className="max-w-xl mx-auto mt-10">

      <Card title="Checkout">

        <Form layout="vertical" onFinish={submitOrder}>

          <Form.Item name="street_address" label="Address" required>
            <Input/>
          </Form.Item>

          <Form.Item name="city" label="City" required>
            <Input/>
          </Form.Item>

          <Form.Item name="state" label="State" required>
            <Input/>
          </Form.Item>

          <Form.Item name="zip_code" label="Zip Code" required>
            <Input/>
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Pay & Place Order
          </Button>

        </Form>

      </Card>

    </div>
  );
}