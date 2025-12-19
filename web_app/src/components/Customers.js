import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "/api/customers/";

export function Customers() {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");


  const fetchCustomers = async () => {
    const res = await axios.get(API, {
      headers: { Authorization: `Token ${token}` },
    });
    setCustomers(res.data);
  };


  const deleteCustomer = async (id) => {
    await axios.delete(`${API}${id}/`, {
      headers: { Authorization: `Token ${token}` },
    });
    message.success("Customer deleted");
    fetchCustomers();
  };


  useEffect(() => {
    fetchCustomers();
  }, []);


  const columns = [
    { title: "Name", render: (_, r) => `${r.first_name} ${r.last_name}` },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "phone_number" },
    { title: "Actions",render: (_, r) => (
      <>
        <Button onClick={() => navigate(`/customers/${r.id}`)}>View</Button>
        <Popconfirm title="Delete?" onConfirm={() => deleteCustomer(r.id)}>
          <Button danger style={{ marginLeft: 8 }}>Delete</Button>
        </Popconfirm>
      </>
      ),
    },
  ];


  return (
    <>
      <Button type="primary" onClick={() => navigate("/customers/add")}>Add Customer</Button>
      <Table rowKey="id" columns={columns} dataSource={customers} style={{ marginTop: 16 }} />
    </>
);
}