import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  DatePicker,
  Button,
  Space,
  message,
  Spin,
  Divider,
} from "antd";
import api from "../components/axios"; // ✅ use shared axios instance
import dayjs from "dayjs";
import "./Appointments.css";

const { Title, Text } = Typography;

const START_HOUR = 9;
const END_HOUR = 19;
const HOUR_HEIGHT = 60;

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [appointmentsNext, setAppointmentsNext] = useState(null);

  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [pendingNext, setPendingNext] = useState(null);

  const [date, setDate] = useState(dayjs());
  const [dayAppointments, setDayAppointments] = useState([]);
  const [dayAppointmentsNext, setDayAppointmentsNext] = useState(null);

  const [loading, setLoading] = useState(false);
  const [animatedPendingIds, setAnimatedPendingIds] = useState(new Set());
  const [animatedUpcomingIds, setAnimatedUpcomingIds] = useState(new Set());
  const [animatedDayIds, setAnimatedDayIds] = useState(new Set());

  const fetchPaginated = async (url, setData, setNext, append = false, animateFn) => {
    try {
      const res = await api.get(url); // ✅ replaced axios

      const newItems = res.data.results;

      setData((prev) => (append ? [...prev, ...newItems] : newItems));
      setNext(res.data.next);

      animateFn((prev) => {
        const ids = new Set(prev);
        newItems.forEach((item) => ids.add(item.id));
        return ids;
      });
    } catch {
      message.error("Failed to load data");
    }
  };

  const loadAppointments = async () => {
    await fetchPaginated(
      "/appointments/?status=A",
      setAppointments,
      setAppointmentsNext,
      false,
      setAnimatedUpcomingIds
    );
  };

  const loadPendingAppointments = async () => {
    await fetchPaginated(
      "/appointments/pending/",
      setPendingAppointments,
      setPendingNext,
      false,
      setAnimatedPendingIds
    );
  };

  const loadDayAppointments = async (selectedDate) => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    await fetchPaginated(
      `/appointments/?status=A&date=${dateStr}`,
      setDayAppointments,
      setDayAppointmentsNext,
      false,
      setAnimatedDayIds
    );
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadAppointments(),
      loadPendingAppointments(),
      loadDayAppointments(date),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadMoreAppointments = () => {
    if (appointmentsNext) {
      fetchPaginated(
        appointmentsNext,
        setAppointments,
        setAppointmentsNext,
        true,
        setAnimatedUpcomingIds
      );
    }
  };

  const loadMorePending = () => {
    if (pendingNext) {
      fetchPaginated(
        pendingNext,
        setPendingAppointments,
        setPendingNext,
        true,
        setAnimatedPendingIds
      );
    }
  };

  const loadMoreDayAppointments = () => {
    if (dayAppointmentsNext) {
      fetchPaginated(
        dayAppointmentsNext,
        setDayAppointments,
        setDayAppointmentsNext,
        true,
        setAnimatedDayIds
      );
    }
  };

  const updateStatus = async (id, action) => {
    try {
      await api.post(`/appointments/${id}/${action}/`); // ✅ replaced axios
      message.success(`Appointment ${action}ed`);
      loadAll();
    } catch {
      message.error("Action failed");
    }
  };

  const now = dayjs();

  const upcomingAppointments = appointments
    .filter((a) => a.accepted === "A" && dayjs(a.start).isAfter(now))
    .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        {/* Upcoming */}
        <Card>
          <Title level={4}>Upcoming Appointments</Title>
          {upcomingAppointments.length === 0 ? (
            <Text type="secondary">No upcoming appointments</Text>
          ) : (
            <>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {upcomingAppointments.map((appt, i) => (
                  <Card
                    key={appt.id}
                    size="small"
                    className={`appt-card ${
                      animatedUpcomingIds.has(appt.id) ? "slide-in" : ""
                    }`}
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Text strong>{appt.customer_full_name}</Text>
                      <Text type="secondary">
                        {dayjs(appt.start).format("dddd, MMM D, h:mm A")} –{" "}
                        {dayjs(appt.end).format("h:mm A")}
                      </Text>
                    </Space>
                  </Card>
                ))}
              </Space>

              {appointmentsNext && (
                <Button style={{ marginTop: 12 }} onClick={loadMoreAppointments}>
                  Load More
                </Button>
              )}
            </>
          )}
        </Card>

        {/* Pending */}
        <Card>
          <Title level={4}>Pending Appointments</Title>

          {pendingAppointments.length === 0 ? (
            <Text type="secondary">No pending appointments</Text>
          ) : (
            <>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {pendingAppointments.map((appt, i) => (
                  <Card
                    key={appt.id}
                    size="small"
                    style={{
                      background: "#fffbe6",
                      transitionDelay: `${i * 50}ms`,
                    }}
                    className={`appt-card ${
                      animatedPendingIds.has(appt.id) ? "slide-in" : ""
                    }`}
                  >
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Space direction="vertical" size={0}>
                        <Text strong>{appt.customer_full_name}</Text>
                        <Text type="secondary">
                          {dayjs(appt.start).format("MMM D, h:mm A")} –{" "}
                          {dayjs(appt.end).format("h:mm A")}
                        </Text>
                      </Space>

                      <Space>
                        <Button
                          type="primary"
                          onClick={() => updateStatus(appt.id, "accept")}
                        >
                          Accept
                        </Button>
                        <Button
                          danger
                          onClick={() => updateStatus(appt.id, "decline")}
                        >
                          Decline
                        </Button>
                      </Space>
                    </Space>
                  </Card>
                ))}
              </Space>

              {pendingNext && (
                <Button style={{ marginTop: 12 }} onClick={loadMorePending}>
                  Load More
                </Button>
              )}
            </>
          )}
        </Card>

        {/* Schedule */}
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>Appointment Schedule</Title>
            <DatePicker
              value={date}
              onChange={(d) => {
                setDate(d);
                loadDayAppointments(d);
              }}
            />
          </Space>

          <Divider />

          <div style={{ display: "flex", borderTop: "1px solid #eee" }}>
            <div style={{ width: 70 }}>
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT, paddingTop: 2, textAlign: "right", paddingRight: 8, fontSize: 12, color: "#999" }}>
                  {dayjs().hour(h).minute(0).format("h A")}
                </div>
              ))}
            </div>

            <div style={{ position: "relative", flex: 1, borderLeft: "1px solid #eee" }}>
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: "1px solid #f0f0f0" }} />
              ))}

              {dayAppointments.map((appt) => {
                const start = dayjs(appt.start);
                const end = dayjs(appt.end);

                const top = ((start.hour() + start.minute() / 60) - START_HOUR) * HOUR_HEIGHT;
                const height = end.diff(start, "minute") * (HOUR_HEIGHT / 60);

                return (
                  <div
                    key={appt.id}
                    className={`appt-bar ${animatedDayIds.has(appt.id) ? "slide-in" : ""}`}
                    style={{ position: "absolute", top, left: 8, right: 8, height, background: "#f6ffed", borderRadius: 6, padding: 8 }}
                  >
                    <Space direction="vertical" size={4}>
                      <Text strong>{start.format("h:mm A")} – {end.format("h:mm A")}</Text>
                      <Text>{appt.customer_full_name}</Text>
                    </Space>
                  </div>
                );
              })}

              {dayAppointmentsNext && (
                <Button style={{ position: "absolute", bottom: 0, left: 8 }} onClick={loadMoreDayAppointments}>Load More</Button>
              )}
            </div>
          </div>
        </Card>
      </Space>
    </Spin>
  );
}