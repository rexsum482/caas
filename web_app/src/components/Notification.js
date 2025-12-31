import { Badge, Drawer, List, Button, Modal } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

const NotificationBell = ({ isAuthenticated, isAdmin }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const {
    notifications,
    unread,
    markRead,
    markAllRead,
    fetchNotifications
  } = useNotifications();

  if (!isAuthenticated) return null;

  const extractId = (key, content) => {
    const match = content?.match(new RegExp(`${key}:(\\d+)`));
    return match ? match[1] : null;
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) await markRead(n.id);

    const invoiceId = extractId("invoice", n.content);
    const appointmentId = extractId("appointment", n.content);

    if (isAdmin) {
      switch (n.type) {
        case "A":
        case "R": navigate("/appointments"); return;
        case "P":
        case "U": if (invoiceId) navigate(`/invoices/${invoiceId}`); return;
        case "M": Modal.info({ title: n.title, content: n.content }); return;
        default: return;
      }
    }

    switch (n.type) {
      case "I":
      case "P":
      case "U": if (invoiceId) navigate(`/invoices/${invoiceId}`); return;
      default: Modal.info({ title: n.title, content: n.content }); return;
    }
  };

  return (
    <>
      <Badge count={unread} size="small" offset={[-2, 4]}>
        <BellOutlined
          style={{ fontSize: 22, cursor: "pointer", color: "white" }}
          onClick={() => {
            setOpen(true);
            fetchNotifications();
          }}
        />
      </Badge>

      <Drawer
        title="Notifications"
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        extra={<Button size="small" onClick={markAllRead}>Mark all read</Button>}
      >
        <List
          locale={{ emptyText: "No notifications" }}
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{ cursor: "pointer", opacity: item.is_read ? 0.6 : 1 }}
            >
              <List.Item.Meta
                title={item.title}
                description={
                  <>
                    <div>{item.content}</div>
                    <small style={{ color: "#888" }}>{item.time_since}</small>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </>
  );
};

export default NotificationBell;
