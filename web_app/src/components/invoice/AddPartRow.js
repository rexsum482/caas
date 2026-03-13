import {
  Input,
  InputNumber,
  Button,
  Grid,
  Row,
  Col,
  Card,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { useBreakpoint } = Grid;

export default function AddPartRow({
  value,
  onChange,
  onAdd,
}) {
  const screens = useBreakpoint();

  return (
    <Card
      size="small"
      bordered
      style={{ marginTop: 16, background: "#fafafa" }}
    >
      <Row gutter={[12, 12]} align="middle">
        {/* Description */}
        <Col xs={24} md={12} lg={10}>
          <Input
            placeholder="Part number or description"
            value={value.description}
            onChange={(e) =>
              onChange({ ...value, description: e.target.value })
            }
          />
        </Col>

        {/* Quantity */}
        <Col xs={12} md={6} lg={4}>
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            placeholder="Qty"
            value={value.quantity}
            onChange={(v) =>
              onChange({ ...value, quantity: v })
            }
          />
        </Col>

        {/* Unit Price */}
        <Col xs={12} md={6} lg={4}>
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Unit price"
            formatter={(v) => `$${v}`}
            parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
            value={value.unit_price}
            onChange={(v) =>
              onChange({ ...value, unit_price: v })
            }
          />
        </Col>

        {/* Button */}
        <Col xs={24} md={24} lg={6}>
          <Button
            type="primary"
            block={!screens.lg}
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            Add Part
          </Button>
        </Col>
      </Row>
    </Card>
  );
}
