import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../components/axios";
import { WEBSOCKET } from "../data/constants";

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);

  // -------------------------
  // Fetch helpers
  // -------------------------
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
    setUnread(u => Math.max(0, u - 1));
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    await api.post("/notifications/mark_all_read/");
    setUnread(0);
    fetchNotifications();
  };

  // -------------------------
  // WebSocket listener
  // -------------------------
    useEffect(() => {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user"));   // we stored it already
    if (!token || !user?.email) return;

    fetchUnread();
    fetchNotifications();

    // connect to WS group for this user email
    const wsUrl = `${WEBSOCKET}/ws/notifications/${user.email}/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => console.log("🔗 WebSocket Connected:", user.email);
    socket.onclose = () => console.log("❌ WebSocket Closed");
    socket.onerror = (e) => console.log("⚠ WebSocket Error:", e);

    socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log("📩 New WebSocket Notification:", data);

        setNotifications(prev => [data, ...prev]);
        setUnread(prev => prev + 1);
    };

    return () => socket.close();
    }, []);
  return (
    <NotificationContext.Provider value={{
      notifications,
      unread,
      fetchNotifications,
      markRead,
      markAllRead,
      setNotifications,
      setUnread
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
