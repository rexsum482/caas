import React, { useEffect, useState } from "react";
import {
  PageContainer,
  ProTable,
} from "@ant-design/pro-components";
import {
  Badge,
  Typography,
  message,
  Switch,
  Button,
  Popconfirm,
  Space,
} from "antd";
import {
  PaperClipOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useNotifications } from "../context/NotificationContext";

const { Text } = Typography;

export default function Messages() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const navigate = useNavigate();
  const { markMessageRead } = useNotifications();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axios.get("/api/messages/", {
        headers: {
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      });

      setData(res.data);
    } catch (err) {
      message.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/messages/${id}/`, {
        headers: {
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      });

      setData((prev) => prev.filter((m) => m.id !== id));
      message.success("Message deleted");
    } catch (err) {
      message.error("Failed to delete message");
    }
  };

  const filteredData = showUnreadOnly
    ? data.filter((m) => !m.read)
    : data;

  const columns = [
    {
      title: "Message",
      dataIndex: "subject",
      render: (_, record) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {!record.read && <Badge status="processing" />}

            <Text strong>{record.sender}</Text>
            <span>—</span>
            <em>{record.subject}</em>

            {record.attachments?.length > 0 && (
              <PaperClipOutlined className="text-gray-500" />
            )}
          </div>

          <Text type="secondary" className="text-xs mt-1">
            {new Date(record.timestamp).toLocaleString()}
          </Text>
        </div>
      ),
    },
    {
      title: "",
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="Delete this message?"
          onConfirm={(e) => {
            e?.stopPropagation();
            handleDelete(record.id);
          }}
        >
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <ProTable
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowClassName="cursor-pointer"
          onRow={(record) => ({
            onClick: () => {
              if (!record.read) {
                markMessageRead(record.id);
              }
              navigate(`/message/${record.id}`);
            },
          })}
          search={{
            placeholder: "Search sender or subject...",
            filterType: "light",
          }}
          toolBarRender={() => [
            <Space key="filters">
              <Switch
                checked={showUnreadOnly}
                onChange={setShowUnreadOnly}
              />
              <span className="text-sm">Unread Only</span>
            </Space>,
          ]}
          pagination={{
            pageSize: 10,
          }}
          options={{
            density: true,
            reload: fetchMessages,
          }}
          cardProps={{
            className: "rounded-2xl shadow-md",
          }}
          locale={{
            emptyText: "No messages found",
          }}
        />
      </div>
    </PageContainer>
  );
}
