import { Badge, Drawer, List, Button, Modal } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./axios";
import { WEBSOCKET } from "../data/constants";

const NotificationBell = ({ isAuthenticated, isAdmin }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  /* =====================
     API helpers
     ===================== */

  const fetchNotifications = async () => {
    const res = await api.get("/notifications/");
    setNotifications(res.data.results || []);
  };

  const fetchUnread = async () => {
    const res = await api.get("/notifications/unread_count/");
    setUnread(res.data.unread || 0);
  };

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/mark_read/`);
    setUnread((u) => Math.max(0, u - 1));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    await api.post("/notifications/mark_all_read/");
    setUnread(0);
    fetchNotifications();
  };

  /* =====================
     Notification Actions
     ===================== */

  const extractId = (key, content) => {
    // TEMP until metadata exists
    const match = content?.match(new RegExp(`${key}:(\\d+)`));
    return match ? match[1] : null;
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) await markRead(n.id);

    const invoiceId = extractId("invoice", n.content);
    const appointmentId = extractId("appointment", n.content);

    /* ---------- ADMIN ---------- */
    if (isAdmin) {
      switch (n.type) {
        case "A": // Appointment
        case "R": // Reminder
          navigate("/appointments");
          return;

        case "P": // Payment
        case "U": // Update
          if (invoiceId) navigate(`/invoices/${invoiceId}`);
          return;

        case "M": // Message
          Modal.info({ title: n.title, content: n.content });
          return;

        default:
          return; // I, S, G should not exist for admin
      }
    }

    /* ---------- CUSTOMER ---------- */
    switch (n.type) {
      case "I":
      case "P":
      case "U":
        if (invoiceId) navigate(`/invoices/${invoiceId}`);
        return;

      case "A":
      case "R":
      case "S":
      case "G":
      case "M":
        Modal.info({ title: n.title, content: n.content });
        return;

      default:
        return;
    }
  };

  /* =====================
     WebSocket
     ===================== */

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnread(0);
      socketRef.current?.close();
      return;
    }

    fetchUnread();

    const token = localStorage.getItem("authToken");
    if (!token) return;

    const socket = new WebSocket(
      `${WEBSOCKET}/ws/notifications/?token=${token}`
    );

    socketRef.current = socket;

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setNotifications((prev) => [data, ...prev]);
      setUnread((prev) => prev + 1);
    };

    return () => socket.close();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  /* =====================
     UI
     ===================== */

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
        extra={
          <Button size="small" onClick={markAllRead}>
            Mark all read
          </Button>
        }
      >
        <List
          locale={{ emptyText: "No notifications" }}
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{
                cursor: "pointer",
                opacity: item.is_read ? 0.6 : 1,
              }}
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
