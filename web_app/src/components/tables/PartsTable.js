import React, { useState } from "react";
import { Input, InputNumber } from "antd";
import EditableSortableTable from "./EditableSortableTable";

export default function PartsTable(props) {
  const {
    onUpdate,
    invoice,
    arrayMove,
    fetchInvoice,
    headers,
    API,
    axios,
  } = props;

  const columns = [
    {
      title: "Part / Description",
      render: (_, p) => (
        <Input
          value={p.description}
          onChange={e =>
            onUpdate(p.id, "description", e.target.value)
          }
        />
      ),
    },
    {
      title: "Qty",
      render: (_, p) => (
        <InputNumber
          min={1}
          value={p.quantity}
          onChange={v => onUpdate(p.id, "quantity", v)}
        />
      ),
    },
    {
      title: "Unit Price",
      render: (_, p) => (
        <InputNumber
          min={0}
          value={p.unit_price}
          onChange={v => onUpdate(p.id, "unit_price", v)}
        />
      ),
    },
  ];
    const [parts, setParts] = useState(invoice.parts || []);

    const softDeletePart = id => {
    setParts(prev => prev.filter(p => p.id !== id));
    };

    const undoDeletePart = part => {
    setParts(prev => [...prev, part].sort((a, b) => a.position - b.position));
    };

    const commitDeletePart = async id => {
    await axios.delete(`${API}/parts/${id}/`, { headers });
    fetchInvoice();
    };

  const onReorder = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const items = [...invoice.parts];
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex);

    await Promise.all(
      reordered.map((item, idx) =>
        axios.patch(`${API}/parts/${item.id}/`, { position: idx }, { headers })
      )
    );

    fetchInvoice();
  };

  return (
    <EditableSortableTable
    data={parts}
    columns={columns}
    dragItems={invoice.parts.map(p => p.id)}
    deleteConfirmText="Delete part?"
    onSoftDelete={softDeletePart}
    onUndoDelete={undoDeletePart}
    onDelete={commitDeletePart}
    onReorder={onReorder}
    />
  );
}
