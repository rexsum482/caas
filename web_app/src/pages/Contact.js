import React, { useState } from "react";
import { Form, Input, Button, Upload, message as antdMessage, Card } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { WEBPAGE } from "../data/constants";
import FormItem from "antd/es/form/FormItem";
const { TextArea } = Input;

const API_BASE = WEBPAGE + '/api'; // adjust if needed
const config = window.DJANGO_CONTEXT;

export default function ContactUs() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const adminEmail = config.adminEmail

  const token = localStorage.getItem("token");

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      // 1️⃣ Create message
      const messageRes = await axios.post(
        `${API_BASE}/messages/`,
        {
          sender: values.email,
          recipient: adminEmail,
          content: values.content,
        },
        {
          headers: {
            Authorization: `Token ${token}`
          },
        }
      );

      const messageId = messageRes.data.id;

      // 2️⃣ Upload attachments
      for (const file of files) {
        const formData = new FormData();
        formData.append("message", messageId);
        formData.append("file", file.originFileObj);

        await axios.post(`${API_BASE}/attachments/`, formData, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      antdMessage.success("Message sent successfully!");
      setFiles([]);
    } catch (err) {
      console.error(err);
      antdMessage.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Contact Us" style={{ maxWidth: 600, margin: "0 auto" }}>
      <Form layout="vertical" onFinish={handleSubmit}>
        <FormItem
          label="Your Email"
            name="email"
            rules={[{ required: true, message: "Please enter your email" }]}
        >
          <Input type="email" />
        </FormItem>
        <Form.Item
          label="Message"
          name="content"
          rules={[{ required: true, message: "Please enter your message" }]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item label="Attachments">
          <Upload
            multiple
            beforeUpload={() => false}
            fileList={files}
            onChange={({ fileList }) => setFiles(fileList)}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Attach Photos</Button>
          </Upload>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
        >
          Send Message
        </Button>
      </Form>
    </Card>
  );
}
