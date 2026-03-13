import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, Typography, Button, Space, message } from "antd";

const { Title, Text } = Typography;
const API = "/appointments";

export default function PublicRescheduleAppointment() {
  const { token } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/reschedule/${token}/`)
      .then(res => {
        setAppointment(res.data.appointment);
        setSlots(res.data.available_slots);
      })
      .catch(() => message.error("Invalid or expired link"));
  }, [token]);

  const submitReschedule = async () => {
    try {
      await axios.post(`${API}/reschedule/${token}/`, {
        date: appointment.requested_date,
        time: selectedTime,
      });

      message.success("Appointment rescheduled!");
    } catch {
      message.error("Reschedule failed");
    }
  };

  if (!appointment) return null;

  return (
    <Card style={{ maxWidth: 600, margin: "auto" }}>
      <Title level={3}>Reschedule Appointment</Title>

      <Text>
        Current Appointment: <br />
        {appointment.requested_date} at {appointment.requested_time}
      </Text>

      <br /><br />

      <Text>Select a new time:</Text>
      <Space wrap>
        {slots.map((s) => (
          <Button
            key={s.time}
            type={selectedTime === s.time ? "primary" : "default"}
            onClick={() => setSelectedTime(s.time)}
          >
            {s.label}
          </Button>
        ))}
      </Space>

      <br /><br />

      <Button
        type="primary"
        disabled={!selectedTime}
        onClick={submitReschedule}
      >
        Confirm Reschedule
      </Button>
    </Card>
  );
}
