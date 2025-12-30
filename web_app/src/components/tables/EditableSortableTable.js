import React from "react";
import { Table, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import useIsMobile from "../../hooks/useIsMobile";
import useSwipeToDelete from "../../hooks/useSwipeToDelete";
import useUndoSnackbar from "../../hooks/useUndoSnackbar";

export default function EditableSortableTable({
  data,
  columns,
  onDelete,
  dragItems,
  onReorder,
  deleteConfirmText,
  onSoftDelete,
  onUndoDelete,
}) {
  const isMobile = useIsMobile();
  const swipe = useSwipeToDelete();
  const undo = useUndoSnackbar({ timeout: 5000 });
  const enhancedColumns = [...columns];

  if (!isMobile) {
    enhancedColumns.push({
      title: "",
      width: 50,
      align: "center",
      render: (_, record) => (
        <Popconfirm
        title={deleteConfirmText}
        onConfirm={() => {
            const removedItem = record;

            onSoftDelete(record.id);

            undo.showUndo({
            label: "Item deleted",
            onUndo: () => onUndoDelete(removedItem),
            onCommit: () => onDelete(record.id),
            });

            swipe.reset(record.id);
        }}
        >
            <DeleteOutlined className="swipe-delete-icon" />
        </Popconfirm>
      ),
    });
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onReorder}>
      <SortableContext items={dragItems} strategy={verticalListSortingStrategy}>
        <Table
          dataSource={data}
          rowKey="id"
          pagination={false}
          columns={enhancedColumns}
          rowClassName={() => (isMobile ? "swipe-row" : "")}
          components={{
            body: {
              row: ({ children, record, ...rest }) => {
                if (!record?.id) {
                  return <tr {...rest}>{children}</tr>;
                }

                const s = swipe.getState(record.id);

                return (
                  <tr
                    {...rest}
                    onPointerDown={e =>
                      swipe.onPointerDown(record.id, e.clientX)
                    }
                    onPointerMove={e =>
                      swipe.onPointerMove(record.id, e.clientX)
                    }
                    onPointerUp={() => swipe.onPointerUp(record.id)}
                    style={{
                      position: "relative",
                      transform: `translateX(${s.deltaX || 0}px)`,
                      transition: "transform 0.2s ease",
                    }}
                  >
                    {/* Delete reveal background */}
                    <td className="swipe-bg">
                      <Popconfirm
                        title={deleteConfirmText}
                        onConfirm={() => {
                          onDelete(record.id);
                          swipe.reset(record.id);
                        }}
                      >
                        <DeleteOutlined className="swipe-delete-icon" />
                      </Popconfirm>
                    </td>

                    {/* Threshold indicator */}
                    {Math.abs(s.deltaX || 0) > swipe.SWIPE_THRESHOLD / 2 && (
                      <div className="swipe-threshold" />
                    )}

                    {children}
                  </tr>
                );
              },
            },
          }}
        />
      </SortableContext>
    </DndContext>
  );
}
