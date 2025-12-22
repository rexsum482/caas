import { Space, Input, InputNumber, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export default function AddLaborRow({
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
        placeholder="Description"
        value={value.description}
        onChange={e => onChange({ ...value, description: e.target.value })}
      />
      <InputNumber
        style={{ width: COL_QTY_WIDTH }}
        min={0}
        value={value.hours}
        onChange={v => onChange({ ...value, hours: v })}
      />
      <InputNumber
        style={{ width: COL_PRICE_WIDTH }}
        min={0}
        value={value.hourly_rate}
        onChange={v => onChange({ ...value, hourly_rate: v })}
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
