import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Typography,
  Spin,
  Layout,
  message as AntMessage,
  Input,
  Badge,
  Switch,
  Space,
} from "antd";
import { PaperClipOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;
const { Content } = Layout;
const { Search } = Input;

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("/api/messages/", {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        });

        setMessages(response.data);
        setFilteredMessages(response.data);
      } catch (err) {
        AntMessage.error("Failed to load messages");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // 🔎 Filtering logic (search + unread toggle)
  useEffect(() => {
    let filtered = [...messages];

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (m) =>
          m.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showUnreadOnly) filtered = filtered.filter((m) => !m.read);

    setFilteredMessages(filtered);
  }, [messages, searchTerm, showUnreadOnly]);

  const columns = useMemo(() => [
    {
      title: "Messages",
      key: "info",
      render: (record) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* 🔹 Blue dot if unread */}
            {!record.read && <Badge status="processing" />}

            <Text strong>{record.sender}</Text> — <em>{record.subject}</em>

            {/* 📎 Paperclip if attachments exist */}
            {record.attachments?.length > 0 && (
              <PaperClipOutlined style={{ fontSize: 15 }} />
            )}
          </span>

          <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
            {new Date(record.timestamp).toLocaleString()}
          </Text>
        </div>
      ),
    },
  ], []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ background: "#fff", padding: 24, minHeight: "100vh" }}>
      <Content style={{ maxWidth: 900, margin: "0 auto" }}>
        <Title level={2} style={{ marginBottom: 20 }}>Messages</Title>

        {/* 🔎 Search & Filter Controls */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="Search sender or subject..."
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 260 }}
          />
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Switch
              checked={showUnreadOnly}
              onChange={setShowUnreadOnly}
            />
            <Text>Show Unread Only</Text>
          </span>
        </Space>

        <Table
          dataSource={filteredMessages}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => navigate(`/message/${record.id}`),
          })}
          rowClassName={() => "cursor-pointer"}
          style={{ background: "white", borderRadius: 8 }}
        />
      </Content>
    </Layout>
  );
}
