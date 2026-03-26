import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useReducer
} from "react";

import api from "../components/axios";
import { WEBSOCKET } from "../data/constants";
import { notification } from "antd";
import { MailOutlined, BellOutlined } from "@ant-design/icons";
import sha256 from "crypto-js/sha256";

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

/* --------------------------------------------------
SAFE GROUP HASH
-------------------------------------------------- */

function safeGroup(email) {

  if (!email) {
    console.warn("⚠ safeGroup called with empty email");
    return null;
  }

  const normalized = email.trim().toLowerCase();
  const fullHash = sha256(normalized).toString();
  const shortHash = fullHash.substring(0, 32);

  return "user_" + shortHash;
}

/* --------------------------------------------------
EVENT REDUCER
Centralized realtime event processing
-------------------------------------------------- */

function eventReducer(state, event) {

  switch (event.type) {

    /* -------- Notification events -------- */

    case "notification": {

      const next = [event.payload, ...state.notifications];

      return {
        ...state,
        notifications: next,
        unread: next.filter(n => !n.is_read).length
      };

    }

    case "notification_sync":

      return {
        ...state,
        notifications: event.payload,
        unread: event.payload.filter(n => !n.is_read).length
      };


    /* -------- Message events -------- */

    case "message": {

      const id = event.payload.id;

      if (state.processed.has(id)) return state;

      const processed = new Set(state.processed);
      processed.add(id);

      if (processed.size > 1000) processed.clear();

      return {
        ...state,
        processed,
        messageUnread: event.payload.read
          ? state.messageUnread
          : state.messageUnread + 1
      };

    }

    case "message_sync":

      return {
        ...state,
        messageUnread: event.payload
      };

    case "message_read":

      return {
        ...state,
        messageUnread: Math.max(0, state.messageUnread - 1)
      };

    default:
      return state;
  }
}

/* --------------------------------------------------
PROVIDER
-------------------------------------------------- */

export function NotificationProvider({ children }) {

  const [state, dispatch] = useReducer(eventReducer, {
    notifications: [],
    unread: 0,
    messageUnread: 0,
    processed: new Set()
  });

  const socketRef = useRef(null);

  const msgQueueRef = useRef([]);
  const timerRef = useRef(null);

  const BATCH_TIME = 3500;

  /* --------------------------------------------------
  API FETCH HELPERS
  -------------------------------------------------- */

  const fetchNotifications = async () => {

    const res = await api.get("/notifications/");
    const list = res.data.results || [];

    dispatch({
      type: "notification_sync",
      payload: list
    });
  };

  const fetchUnread = async () => {
    await api.get("/notifications/unread_count/");
  };

  const fetchMessageUnread = async () => {

    const res = await api.get("/messages/unread-count/");

    dispatch({
      type: "message_sync",
      payload: res.data.unread_count || 0
    });
  };

  /* --------------------------------------------------
  NOTIFICATION ACTIONS
  -------------------------------------------------- */

  const markRead = async (id) => {

    await api.post(`/notifications/${id}/mark_read/`);

    dispatch({
      type: "notification_sync",
      payload: state.notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      )
    });
  };

  const markAllRead = async () => {

    await api.post("/notifications/mark_all_read/");

    dispatch({
      type: "notification_sync",
      payload: state.notifications.map(n => ({
        ...n,
        is_read: true
      }))
    });
  };

  /* --------------------------------------------------
  MESSAGE ACTION
  -------------------------------------------------- */

  const markMessageRead = () => {
    dispatch({ type: "message_read" });
  };

  /* --------------------------------------------------
  NOTIFICATION CLICK ROUTER
  -------------------------------------------------- */

  const handleNotificationClick = (notif) => {

    const meta = notif.metadata || {};

    markRead(notif.id);

    /* Appointment notification */

    if (notif.type === "A" && meta.appointment_id) {

      const url = `/appointments?appointment=${meta.appointment_id}`;

      if (window.location.pathname !== "/appointments") {
        window.location.href = url;
      }

      return;
    }

    /* Invoice notification */

    if (notif.type === "I" && meta.invoice_id) {

      const url = `/invoices?invoice=${meta.invoice_id}`;

      if (window.location.pathname !== "/invoices") {
        window.location.href = url;
      }

      return;
    }

  };

  /* --------------------------------------------------
  WEBSOCKET CONNECTION
  -------------------------------------------------- */

  useEffect(() => {

    if (socketRef.current) return;

    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user?.email) return;

    fetchNotifications();
    fetchUnread();
    fetchMessageUnread();

    const group = safeGroup(user.email);

    const wsUrl =
      `${WEBSOCKET}/ws/notifications/${group}/?token=${token}`;

    const socket = new WebSocket(wsUrl);

    socketRef.current = socket;

    socket.onopen = () =>
      console.log("🔗 WebSocket Connected:", user.email);

    socket.onclose = () =>
      console.log("❌ WebSocket Closed");

    socket.onerror = (e) =>
      console.log("⚠ WebSocket Error:", e);

    /* --------------------------------------------------
    WEBSOCKET MESSAGE HANDLER
    -------------------------------------------------- */

    socket.onmessage = (e) => {

      const data = JSON.parse(e.data);

      dispatch(data);

      /* -------- Notification UI -------- */

      if (data.type === "notification") {

        const notif = data.payload;

        notification.open({
          message: notif.title,
          description: notif.content,
          icon: <BellOutlined style={{ color: "#1677ff" }} />,
          onClick: () => handleNotificationClick(notif)
        });

      }

      /* -------- Message UI -------- */

      if (data.type === "message") {

        const m = data.payload;

        msgQueueRef.current.push(m);

        if (timerRef.current)
          clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {

          const queue = msgQueueRef.current;

          if (queue.length === 1) {

            const msg = queue[0];

            notification.open({
              message: "New Message",
              icon: <MailOutlined style={{ color: "#1677ff" }} />,
              description:
                <div>
                  <b>{msg.sender}</b>: {msg.subject}
                </div>,
              onClick: () => {
                if (window.location.pathname !== "/messages") {
                  window.location.href = "/messages";
                }
              }
            });

          } else {

            notification.open({
              message: `${queue.length} New Messages`,
              description: queue
                .slice(0, 4)
                .map((m, i) => (
                  <div key={i}>
                    • <b>{m.sender}</b>: {m.subject}
                  </div>
                )),
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

  /* --------------------------------------------------
  PROVIDER VALUE
  -------------------------------------------------- */

  return (

    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        unread: state.unread,
        messageUnread: state.messageUnread,

        fetchNotifications,
        fetchMessageUnread,

        markRead,
        markAllRead,
        markMessageRead
      }}
    >

      {children}

    </NotificationContext.Provider>

  );
}
