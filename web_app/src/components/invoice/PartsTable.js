import React from "react";
import { Table, Input, InputNumber, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

function PartsTable({
  parts,
  onUpdate,
  onDelete,
  COL_DESC_WIDTH,
  COL_QTY_WIDTH,
  COL_PRICE_WIDTH,
  COL_ACTION_WIDTH,
  invoice,
  fetchInvoice,
  headers,
  API,
  axios,
  arrayMove,
}) {
  return (
<DndContext collisionDetection={closestCenter} onDragEnd={async ({ active, over }) => { if (!over || active.id === over.id) return; const items = [...invoice.parts]; const oldIndex = items.findIndex(i => i.id === active.id); const newIndex = items.findIndex(i => i.id === over.id); const reordered = arrayMove(items, oldIndex, newIndex); await Promise.all( reordered.map((item, idx) => axios.patch(`${API}/parts/${item.id}/`, { position: idx }, { headers }) ) ); fetchInvoice(); }} >
<SortableContext items={invoice.parts.map(p => p.id)} strategy={verticalListSortingStrategy} >
        <Table
          dataSource={parts}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: "Part Number / Description",
              width: COL_DESC_WIDTH,
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
              width: COL_QTY_WIDTH,
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
              width: COL_PRICE_WIDTH,
              render: (_, p) => (
                <InputNumber
                  min={0}
                  value={p.unit_price}
                  onChange={v => onUpdate(p.id, "unit_price", v)}
                />
              ),
            },
            {
              title: "",
              width: COL_ACTION_WIDTH,
              render: (_, p) => (
                <Popconfirm title="Delete part?" onConfirm={() => onDelete(p.id)}>
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
export default React.memo(PartsTable);