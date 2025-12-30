import React, { useState } from "react";
import { Input, InputNumber } from "antd";
import EditableSortableTable from "./EditableSortableTable";

export default function LaborTable(props) {
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
      title: "Description",
      render: (_, l) => (
        <Input
          value={l.description}
          onChange={e =>
            onUpdate(l.id, "description", e.target.value)
          }
        />
      ),
    },
    {
      title: "Hours",
      render: (_, l) => (
        <InputNumber
          min={0}
          value={l.hours}
          onChange={v => onUpdate(l.id, "hours", v)}
        />
      ),
    },
    {
      title: "Rate",
      render: (_, l) => (
        <InputNumber
          min={0}
          value={l.hourly_rate}
          onChange={v => onUpdate(l.id, "hourly_rate", v)}
        />
      ),
    },
  ];
const [labor, setLabor] = useState(invoice.labor || []);

const softDeleteLabor = id => {
  setLabor(prev => prev.filter(l => l.id !== id));
};

const undoDeleteLabor = labor => {
  setLabor(prev => [...prev, labor].sort((a, b) => a.position - b.position));
};

const commitDeleteLabor = async id => {
  await axios.delete(`${API}/labor/${id}/`, { headers });
  fetchInvoice();
};

  const onReorder = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const items = [...invoice.labor];
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex);

    await Promise.all(
      reordered.map((item, idx) =>
        axios.patch(`${API}/labor/${item.id}/`, { position: idx }, { headers })
      )
    );

    fetchInvoice();
  };

  return (
    <EditableSortableTable
      data={labor}
      columns={columns}
      dragItems={invoice.labor.map(l => l.id)}
      onDelete={commitDeleteLabor}
      onSoftDelete={softDeleteLabor}
      onUndoDelete={undoDeleteLabor}
      onReorder={onReorder}
      deleteConfirmText="Delete labor?"
    />
  );
}
