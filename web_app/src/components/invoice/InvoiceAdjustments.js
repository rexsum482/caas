import React from "react";
import { Space, Typography, InputNumber } from "antd";
const { Text } = Typography;

function InvoiceAdjustments({ tax, discount, onChange }) {
  return (
    <Space>
      <Text>Tax %</Text>
      <InputNumber
        value={tax}
        onChange={v => onChange("tax_rate", v)}
      />

      <Text>Discount</Text>
      <InputNumber
        value={discount}
        onChange={v => onChange("discount", v)}
      />
    </Space>
  );
}

export default React.memo(InvoiceAdjustments);