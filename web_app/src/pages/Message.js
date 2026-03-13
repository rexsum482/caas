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
  Avatar,
  Divider,
  Grid,
  List,
  message as AntMessage,
} from "antd";
import {
  MailOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

/* ---------- Helpers ---------- */

function fileIcon(filename = "") {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return <FileImageOutlined />;
  }
  if (ext === "pdf") {
    return <FilePdfOutlined />;
  }
  return <FileOutlined />;
}

/* ---------- Component ---------- */

export default function Message() {
  const { id } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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

        if (!res.data.read) {
          await axios.patch(
            `/api/messages/${id}/`,
            { read: true },
            {
              headers: {
                Authorization: `Token ${localStorage.getItem("authToken")}`,
              },
            }
          );
        }
      } catch {
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
    } catch {
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
      <Card style={{ maxWidth: 900, margin: "24px auto" }}>
        {/* ---------- Back ---------- */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/messages")}
          style={{ marginBottom: 16 }}
        >
          Back
        </Button>

        {/* ---------- Header ---------- */}
        <Space align="start" style={{ width: "100%" }}>
          <Avatar size={48}>
            {message.sender?.[0]?.toUpperCase()}
          </Avatar>

          <div style={{ flex: 1 }}>
            <Title level={4} style={{ marginBottom: 4 }}>
              {message.subject}
            </Title>

            <Text strong style={{ display: "block" }}>
              {message.sender}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(message.timestamp).toLocaleString()}
            </Text>
          </div>
        </Space>

        <Divider />

        {/* ---------- Body ---------- */}
        <div
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          {message.content}
        </div>

        {/* ---------- Attachments ---------- */}
        {message.attachments?.length > 0 && (
          <>
            <Divider orientation="left">
              <Text strong>Attachments</Text>
            </Divider>

            <List
              itemLayout="horizontal"
              dataSource={message.attachments}
              renderItem={(attachment) => {
                const filename =
                  attachment.name ||
                  attachment.file?.split("/").pop();

                return (
                  <List.Item
                    actions={[
                      <Button
                        key="download"
                        type="link"
                        icon={<DownloadOutlined />}
                        href={attachment.file}
                        target="_blank"
                      />,
                    ]}
                    onClick={() =>
                      /\.(jpg|jpeg|png|gif|webp)$/i.test(filename) &&
                      setAttachmentPreview(attachment)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <List.Item.Meta
                      avatar={fileIcon(filename)}
                      title={filename}
                    />
                  </List.Item>
                );
              }}
            />
          </>
        )}

        {/* ---------- Actions ---------- */}
        <Divider />

        <Space
          direction={isMobile ? "vertical" : "horizontal"}
          style={{ width: "100%" }}
        >
          <Button
            type="primary"
            icon={<MailOutlined />}
            href={replyMailto}
            block={isMobile}
          >
            Reply
          </Button>

          <Popconfirm
            title="Delete this message?"
            onConfirm={deleteMessage}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              block={isMobile}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </Card>

      {/* ---------- Attachment Preview ---------- */}
      <Modal
        open={!!attachmentPreview}
        footer={null}
        onCancel={() => setAttachmentPreview(null)}
        width={isMobile ? "90%" : 700}
      >
        <Title level={4}>Attachment Preview</Title>

        {attachmentPreview &&
        /\.(jpg|jpeg|png|gif|webp)$/i.test(
          attachmentPreview.file
        ) ? (
          <Image
            src={attachmentPreview.file}
            style={{ maxHeight: 500, objectFit: "contain" }}
          />
        ) : (
          attachmentPreview && (
            <a href={attachmentPreview.file} download>
              Download file
            </a>
          )
        )}
      </Modal>
    </>
  );
}
