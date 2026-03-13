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

export default function AddLaborRow({
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
            placeholder="Labor description"
            value={value.description}
            onChange={(e) =>
              onChange({ ...value, description: e.target.value })
            }
          />
        </Col>

        {/* Hours */}
        <Col xs={12} md={6} lg={4}>
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Hours"
            value={value.hours}
            onChange={(v) => onChange({ ...value, hours: v })}
          />
        </Col>

        {/* Rate */}
        <Col xs={12} md={6} lg={4}>
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Hourly rate"
            formatter={(v) => `$${v}`}
            parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
            value={value.hourly_rate}
            onChange={(v) =>
              onChange({ ...value, hourly_rate: v })
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
            Add Labor
          </Button>
        </Col>
      </Row>
    </Card>
  );
}
