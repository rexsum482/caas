import { Space, Input, InputNumber, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export default function AddPartRow({
  value,
  onChange,
  onAdd,
  COL_DESC_WIDTH,
  COL_QTY_WIDTH,
  COL_PRICE_WIDTH,
  COL_ACTION_WIDTH,
}) {
  return (
    <Space style={{ marginTop: 8 }}>
      <Input
        style={{ width: COL_DESC_WIDTH }}
        placeholder="Part Number / Description"
        value={value.description}
        onChange={e => onChange({ ...value, description: e.target.value })}
      />

      <InputNumber
        style={{ width: COL_QTY_WIDTH }}
        min={1}
        value={value.quantity}
        onChange={v => onChange({ ...value, quantity: v })}
      />

      <InputNumber
        style={{ width: COL_PRICE_WIDTH }}
        min={0}
        value={value.unit_price}
        onChange={v => onChange({ ...value, unit_price: v })}
      />

      <Button
        style={{ width: COL_ACTION_WIDTH }}
        icon={<PlusOutlined />}
        type="primary"
        onClick={onAdd}
      >
        Add
      </Button>
    </Space>
  );
}
