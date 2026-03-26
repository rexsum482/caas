import React, { useState, useEffect } from "react";
import { Form, Input, Button, Upload, message as antdMessage, Card } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { WEBPAGE } from "../data/constants";
import { useNavigate } from "react-router-dom";
import FormItem from "antd/es/form/FormItem";

const { TextArea } = Input;

const API_BASE = WEBPAGE + "/api";

export default function ContactUs() {

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const token = localStorage.getItem("authToken");


  useEffect(() => {

    const user = localStorage.getItem("user");

    if (!user) return;

    const data = JSON.parse(user);

    form.setFieldsValue({
      email: data.email,
      name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
      phone: data.phone_number,
      address: data.street_address,
      city: data.city,
      state: data.state,
      zip: data.zip_code,
    });

  }, [form]);


  const handleSubmit = async (values) => {

    setLoading(true);

    try {

      const messageRes = await axios.post(
        `${API_BASE}/messages/`,
        {
          sender: values.email,
          subject: values.subject || "No Subject",
          content: values.content,
        },
        {
          headers: token
            ? { Authorization: `Token ${token}` }
            : {},
        }
      );

      const messageId = messageRes.data.id;

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

      setTimeout(() => {

        alert("Your message has been sent successfully!");

        navigate("/");

      }, 500);

    } catch (err) {

      console.error(err);

      antdMessage.error("Failed to send message");

    } finally {

      setLoading(false);

    }
  };


  return (

    <Card title="Contact Us" style={{ maxWidth: 600, margin: "0 auto" }}>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >

        <FormItem
          label="Your Email"
          name="email"
          rules={[{ required: true, message: "Please enter your email" }]}
        >
          <Input type="email" />
        </FormItem>


        <Form.Item label="Name" name="name">
          <Input />
        </Form.Item>


        <Form.Item label="Phone" name="phone">
          <Input />
        </Form.Item>


        <Form.Item label="Subject" name="subject">
          <Input />
        </Form.Item>


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

            <Button icon={<UploadOutlined />}>
              Attach Photos
            </Button>

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
