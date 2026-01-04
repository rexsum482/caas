import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../components/axios";
import { WEBSOCKET } from "../data/constants";
import { notification } from "antd";
import { MailOutlined, BellOutlined } from "@ant-design/icons";
import sha256 from "crypto-js/sha256";

function safeGroup(email){
  return "user_"+sha256(email.toLowerCase()).toString().substring(0,32);
}

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const msgQueueRef = useRef([]);
  const timerRef = useRef(null);
  const BATCH_TIME = 3500; // ms
  // -------------------------
  // Fetch helpers
  // -------------------------
  const fetchNotifications = async () => {
    const res = await api.get("/notifications/");
    const list = res.data.results || [];

    setNotifications(list);
    setUnread(list.filter(n => !n.is_read).length);
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
    if (socketRef.current) return;
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user"));   // we stored it already
    if (!token || !user?.email) return;

    fetchUnread();
    fetchNotifications();

    // connect to WS group for this user email
    const group = safeGroup(user.email);
    const wsUrl = `${WEBSOCKET}/ws/notifications/${group}/?token=${token}`;    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => console.log("🔗 WebSocket Connected:", user.email);
    socket.onclose = () => console.log("❌ WebSocket Closed");
    socket.onerror = (e) => console.log("⚠ WebSocket Error:", e);

socket.onmessage = (e) => {
    const data = JSON.parse(e.data);

    // -------- Notifications ------------
    if(data.type==="notification"){
        setNotifications(prev => {
          const next = [data.payload, ...prev];
          setUnread(next.filter(n => !n.is_read).length);
          return next;
        });
        notification.open({
          message:data.payload.title,
          description:data.payload.content,
          icon:<BellOutlined style={{color:"#1677ff"}} />,
          onClick:()=>markRead(data.payload.id),
        });
        
    }

    // -------- Messages ------------------
    if(data.type==="message"){
      msgQueueRef.current.push(data.payload);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const queue = msgQueueRef.current;

        if (queue.length === 1) {
          const m = queue[0];
          notification.open({
            message: "New Message",
            icon: <MailOutlined style={{ color: "#1677ff" }} />,
            description: <div><b>{m.sender}</b>: {m.subject}</div>,
            onClick: () => {
              if (window.location.pathname !== "/messages") {
                window.location.href = "/messages";
              }
            }
          });
        } else {
          notification.open({
            message: `${queue.length} New Messages`,
            description: queue.slice(0, 4).map((m, i) =>
              <div key={i}>• <b>{m.sender}</b>: {m.subject}</div>
            ),
            onClick: () => {
              if (window.location.pathname !== "/messages") {
                window.location.href = "/messages";
              }
            }
          });
        }

        msgQueueRef.current = [];
        timerRef.current = null;
      }, BATCH_TIME);
          }

};


return () => {
  socket.onopen = null;
  socket.onclose = null;
  socket.onmessage = null;
  socket.onerror = null;
  socketRef.current = null;
  socket.close();
};
    }, []);
  return (
    <NotificationContext.Provider value={{
      notifications,
      unread,
      fetchNotifications,
      markRead,
      markAllRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
