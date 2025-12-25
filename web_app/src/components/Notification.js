import { Badge, Drawer, List, Button } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import api from "./axios";
import { WEBSOCKET } from "../data/constants";

const NotificationBell = ({ isAuthenticated }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifications(res.data.results || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const fetchUnread = async () => {
    try {
      const res = await api.get("/notifications/unread_count/");
      setUnread(res.data.unread || 0);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/mark_all_read/");
      setUnread(0);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  useEffect(() => {
    // 🔒 Always call hook — condition inside
    if (!isAuthenticated) {
      setNotifications([]);
      setUnread(0);

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    fetchUnread();

    const token = localStorage.getItem("authToken");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(
      `${WEBSOCKET}/ws/notifications/?token=${token}`
    );

    socketRef.current = socket;

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setNotifications(prev => [data, ...prev]);
      setUnread(prev => prev + 1);
    };

    socket.onerror = (err) => {
      console.error("Notification WS error", err);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  // 🔕 Nothing rendered if not logged in
  if (!isAuthenticated) return null;

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
            <List.Item style={{ opacity: item.is_read ? 0.6 : 1 }}>
              <List.Item.Meta
                title={item.title}
                description={
                  <>
                    <div>{item.content}</div>
                    <small style={{ color: "#888" }}>
                      {item.time_since}
                    </small>
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
