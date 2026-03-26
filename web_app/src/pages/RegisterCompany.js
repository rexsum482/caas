import React from "react";
import {
  StepsForm,
  ProFormText,
  ProFormColorPicker,
  ProFormTimePicker,
} from "@ant-design/pro-components";
import { Card, message } from "antd";
import api from "../components/axios";
import { useNavigate } from "react-router-dom";

const days = [
  { label: "Sunday", key: "0" },
  { label: "Monday", key: "1" },
  { label: "Tuesday", key: "2" },
  { label: "Wednesday", key: "3" },
  { label: "Thursday", key: "4" },
  { label: "Friday", key: "5" },
  { label: "Saturday", key: "6" },
];

export default function RegisterCompany() {
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      // 🧠 Transform business hours
      const business_hours = {};

      days.forEach((day) => {
        const start = values[`start_${day.key}`];
        const end = values[`end_${day.key}`];

        if (start && end) {
          business_hours[day.key] = [
            start.format("HH:mm"),
            end.format("HH:mm"),
          ];
        }
      });

      const payload = {
        ...values,
        business_hours,
      };

      const res = await api.post("/companies/", payload);

      const company = res.data;
      const subdomain = company.subdomain;

      // 🔥 build correct domain
      const protocol = window.location.protocol;
      const rootDomain = window.location.hostname
        .split(".")
        .slice(-2)
        .join(".");

      // 👉 example: app.com → plumber.app.com
      const newUrl = `${protocol}//${subdomain}.${rootDomain}`;

      message.success("Company created successfully 🎉");

      // 🔥 HARD redirect to new subdomain
      window.location.href = newUrl;
    } catch (err) {
      console.error(err);
      message.error("Failed to create company");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-3xl rounded-2xl shadow-lg">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Set Up Your Business
        </h1>

        <StepsForm
          onFinish={handleSubmit}
          submitter={{
            render: (props) => (
              <div className="flex justify-end gap-2">
                {props.step > 0 && (
                  <button
                    className="px-4 py-2 rounded-lg border"
                    onClick={() => props.onPre?.()}
                  >
                    Back
                  </button>
                )}
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                  onClick={() => props.onSubmit?.()}
                >
                  {props.step === props.total - 1 ? "Create Company" : "Next"}
                </button>
              </div>
            ),
          }}
        >
          {/* STEP 1: BASIC INFO */}
          <StepsForm.StepForm name="basic" title="Business Info">
            <ProFormText
              name="name"
              label="Company Name"
              placeholder="Reliable Air & Appliance"
              rules={[{ required: true }]}
            />

            <ProFormText
              name="short_name"
              label="Short Name"
              placeholder="Reliable A&A"
            />

            <ProFormText
              name="admin_email"
              label="Admin Email"
              rules={[{ required: true, type: "email" }]}
            />

            <ProFormText
              name="phone"
              label="Phone"
              placeholder="(682) 710-1001"
            />
          </StepsForm.StepForm>

          {/* STEP 2: ADDRESS */}
          <StepsForm.StepForm name="address" title="Address">
            <ProFormText name="street_address" label="Street Address" />
            <ProFormText name="city" label="City" />
            <ProFormText name="state" label="State" />
            <ProFormText name="zip_code" label="Zip Code" />
          </StepsForm.StepForm>

          {/* STEP 3: BRANDING */}
          <StepsForm.StepForm name="branding" title="Branding">
            <div className="grid grid-cols-2 gap-4">
              <ProFormColorPicker name="primary_color" label="Primary Color" />
              <ProFormColorPicker name="accent_color" label="Accent Color" />
              <ProFormColorPicker name="alert_color" label="Alert Color" />
              <ProFormColorPicker name="warning_color" label="Warning Color" />
              <ProFormColorPicker name="success_color" label="Success Color" />
            </div>
          </StepsForm.StepForm>

          {/* STEP 4: BUSINESS HOURS */}
          <StepsForm.StepForm name="hours" title="Business Hours">
            <div className="space-y-4">
              {days.map((day) => (
                <div
                  key={day.key}
                  className="flex items-center gap-4 border rounded-lg p-3"
                >
                  <div className="w-28 font-medium">{day.label}</div>

                  <ProFormTimePicker
                    name={`start_${day.key}`}
                    placeholder="Start"
                  />

                  <ProFormTimePicker
                    name={`end_${day.key}`}
                    placeholder="End"
                  />
                </div>
              ))}
            </div>
          </StepsForm.StepForm>
        </StepsForm>
      </Card>
    </div>
  );
}
