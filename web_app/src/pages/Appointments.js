import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  DatePicker,
  Button,
  Space,
  Badge,
  message,
  Spin,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API = "/api/appointments/";
const START_HOUR = 9;
const END_HOUR = 19;
const HOUR_HEIGHT = 60; // px per hour (Google-like)

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Load appointments
  // -----------------------------
  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setAppointments(res.data);
    } catch {
      message.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // -----------------------------
  // Accept / Decline
  // -----------------------------
  const updateStatus = async (id, action) => {
    try {
      await axios.post(`${API}${id}/${action}/`);
      message.success(`Appointment ${action}ed`);
      loadAppointments();
    } catch {
      message.error("Action failed");
    }
  };

  // -----------------------------
  // Filter day appointments
  // -----------------------------
  const dayAppointments = appointments.filter((a) =>
    dayjs(a.start).isSame(date, "day")
  );

  // -----------------------------
  // Render time grid hours
  // -----------------------------
  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  return (
    <Spin spinning={loading}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            Appointment Schedule
          </Title>
          <DatePicker
            value={date}
            onChange={(d) => setDate(d)}
          />
        </Space>

        {/* GRID */}
        <div style={{ display: "flex", borderTop: "1px solid #eee" }}>
          {/* TIME LABELS */}
          <div style={{ width: 70 }}>
            {hours.map((h) => (
              <div
                key={h}
                style={{
                  height: HOUR_HEIGHT,
                  paddingTop: 2,
                  textAlign: "right",
                  paddingRight: 8,
                  fontSize: 12,
                  color: "#999",
                }}
              >
                {dayjs().hour(h).minute(0).format("h A")}
              </div>
            ))}
          </div>

          {/* DAY COLUMN */}
          <div
            style={{
              position: "relative",
              flex: 1,
              borderLeft: "1px solid #eee",
            }}
          >
            {/* Hour lines */}
            {hours.map((h) => (
              <div
                key={h}
                style={{
                  height: HOUR_HEIGHT,
                  borderBottom: "1px solid #f0f0f0",
                }}
              />
            ))}

            {/* APPOINTMENTS */}
            {dayAppointments.map((appt) => {
              const start = dayjs(appt.start);
              const end = dayjs(appt.end);

              const top =
                ((start.hour() + start.minute() / 60) - START_HOUR) *
                HOUR_HEIGHT;

              const height =
                end.diff(start, "minute") *
                (HOUR_HEIGHT / 60);

              return (
                <div
                  key={appt.id}
                  style={{
                    position: "absolute",
                    top,
                    left: 8,
                    right: 8,
                    height,
                    background:
                      appt.accepted === "A"
                        ? "#f6ffed"
                        : appt.accepted === "P"
                        ? "#fffbe6"
                        : "#fff1f0",
                    border:
                      appt.accepted === "A"
                        ? "1px solid #b7eb8f"
                        : appt.accepted === "P"
                        ? "1px solid #ffe58f"
                        : "1px solid #ffa39e",
                    borderRadius: 6,
                    padding: 8,
                    overflow: "hidden",
                  }}
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Text strong>
                      {start.format("h:mm A")} –{" "}
                      {end.format("h:mm A")}
                    </Text>

                    <Text>
                      {appt.customer_full_name}
                    </Text>

                    <Badge
                      status={
                        appt.accepted === "A"
                          ? "success"
                          : appt.accepted === "P"
                          ? "warning"
                          : "error"
                      }
                      text={appt.status_display}
                    />

                    {appt.accepted === "P" && (
                      <Space>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() =>
                            updateStatus(appt.id, "accept")
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={() =>
                            updateStatus(appt.id, "decline")
                          }
                        >
                          Decline
                        </Button>
                      </Space>
                    )}
                  </Space>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </Spin>
  );
}
