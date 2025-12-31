import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Spin,
  Modal,
  Image,
  Popconfirm,
  message as AntMessage,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MailOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function Message() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await axios.get(`/api/messages/${id}/`, {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        });

        setMessage(res.data);

        // Auto mark as read if unread
        if (!res.data.read) {
          await axios.patch(`/api/messages/${id}/`, { read: true },{
            headers: { Authorization: `Token ${localStorage.getItem("authToken")}` },
          });
        }

      } catch (err) {
        AntMessage.error("Unable to load message");
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [id]);

  const deleteMessage = async () => {
    try {
      await axios.delete(`/api/messages/${id}/`, {
        headers: {
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      });
      AntMessage.success("Message deleted");
      navigate("/messages");
    } catch (err) {
      AntMessage.error("Delete failed");
    }
  };

  if (loading || !message) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const replyMailto = `mailto:${message.sender}?subject=Re: ${message.subject}`;

  return (
    <>
      <Card
        bordered
        style={{ maxWidth: 900, margin: "0 auto", marginTop: 30 }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/messages")}>
            Back
          </Button>

          <Title level={3}>{message.subject}</Title>

          <Space direction="vertical">
            <Text strong>{message.sender}</Text>
            <Text type="secondary">
              {new Date(message.timestamp).toLocaleString()}
            </Text>
          </Space>

          <Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {message.body}
          </Paragraph>

          {message.attachments?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <Text strong>Attachments:</Text>
              <br />
              {message.attachments.map((file, i) => (
                <Button
                  key={i}
                  type="link"
                  icon={<PaperClipOutlined />}
                  onClick={() => setAttachmentPreview(file)}
                >
                  {file}
                </Button>
              ))}
            </div>
          )}

          <Space style={{ marginTop: 20 }}>
            <Button type="primary" icon={<MailOutlined />} href={replyMailto}>
              Reply
            </Button>

            <Popconfirm
              title="Are you sure you want to delete this message?"
              onConfirm={deleteMessage}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        </Space>
      </Card>

      {/* Attachment Preview Modal */}
      <Modal
        open={!!attachmentPreview}
        footer={null}
        onCancel={() => setAttachmentPreview(null)}
        width={700}
      >
        <Title level={4}>Attachment Preview</Title>
        {attachmentPreview && attachmentPreview.match(/\.(jpg|jpeg|png|gif)$/i) ? (
          <Image
            src={attachmentPreview}
            style={{ maxHeight: 500, objectFit: "contain" }}
          />
        ) : (
          <a href={attachmentPreview} download>
            Click to download file
          </a>
        )}
      </Modal>
    </>
  );
}
