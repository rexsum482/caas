import React from "react";
import { Table, Input, InputNumber, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

function LaborTable({
  labor,
  onUpdate,
  onDelete,
  COL_DESC_WIDTH,
  COL_QTY_WIDTH,
  COL_PRICE_WIDTH,
  COL_ACTION_WIDTH,
  arrayMove,
  invoice,
  fetchInvoice,
  headers,
  API,
  axios,
}) {
  return (
<DndContext collisionDetection={closestCenter} onDragEnd={async ({ active, over }) => { if (!over || active.id === over.id) return; const items = [...invoice.parts]; const oldIndex = items.findIndex(i => i.id === active.id); const newIndex = items.findIndex(i => i.id === over.id); const reordered = arrayMove(items, oldIndex, newIndex); await Promise.all( reordered.map((item, idx) => axios.patch(`${API}/parts/${item.id}/`, { position: idx }, { headers }) ) ); fetchInvoice(); }} > 
      <SortableContext items={invoice.parts.map(p => p.id)} strategy={verticalListSortingStrategy} > 
    <Table
      dataSource={labor}
      rowKey="id"
      pagination={false}
      columns={[
        {
          title: "Description",
          width: COL_DESC_WIDTH,
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
          width: COL_QTY_WIDTH,
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
          width: COL_PRICE_WIDTH,
          render: (_, l) => (
            <InputNumber
              min={0}
              value={l.hourly_rate}
              onChange={v => onUpdate(l.id, "hourly_rate", v)}
            />
          ),
        },
        { title: "Total", dataIndex: "total_price" },
        {
          title: "",
          width: COL_ACTION_WIDTH,
          render: (_, l) => (
            <Popconfirm title="Delete labor?" onConfirm={() => onDelete(l.id)}>
              <DeleteOutlined style={{ color: "red" }} />
            </Popconfirm>
          ),
        },
      ]}
    />
      </SortableContext>
    </DndContext>
  );
}

export default React.memo(LaborTable);