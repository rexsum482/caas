import React, { useEffect, useRef, useState } from "react";
import { PageContainer, ProForm, ProFormText } from "@ant-design/pro-components";
import { Card, message, Spin, notification, Button } from "antd";
import axios from "axios";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/users/me/", {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        });

        setInitialValues(res.data);
      } catch (err) {
        message.error("Failed to load profile");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleFinish = async (values) => {
    const prevValues = { ...initialValues };
    const updatedValues = { ...initialValues, ...values };

    // optimistic update
    setInitialValues(updatedValues);
    setSaving(true);

    try {
      await axios.patch("/api/users/update_me/", values, {
        headers: {
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      });

      setIsDirty(false);
      message.success("Profile updated successfully");

      // undo option
      notification.success({
        message: "Profile Updated",
        description: "Your changes were saved.",
        btn: (
          <Button
            size="small"
            onClick={async () => {
              try {
                setInitialValues(prevValues);
                await axios.patch("/api/users/update_me/", prevValues, {
                  headers: {
                    Authorization: `Token ${localStorage.getItem("authToken")}`,
                  },
                });
                message.success("Changes reverted");
              } catch (err) {
                message.error("Failed to undo changes");
              }
            }}
          >
            Undo
          </Button>
        ),
      });
    } catch (err) {
      // rollback
      setInitialValues(prevValues);
      message.error("Failed to update profile");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-md rounded-2xl">
          <ProForm
            formRef={formRef}
            initialValues={initialValues}
            onFinish={handleFinish}
            key={JSON.stringify(initialValues)}
            onValuesChange={() => {
              const touched = formRef.current?.isFieldsTouched?.();
              setIsDirty(!!touched);
            }}
            submitter={{
              searchConfig: {
                submitText: saving ? "Saving..." : "Save Changes",
              },
              submitButtonProps: {
                loading: saving,
                disabled: !isDirty,
              },
            }}
          >
            {/* Account Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Account Info</h2>
              <ProFormText
                name="username"
                label="Username"
                disabled
              />

              <ProFormText
                name="email"
                label="Email"
                disabled
              />
            </div>

            {/* Personal Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Personal Info</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProFormText name="first_name" label="First Name" />
                <ProFormText name="last_name" label="Last Name" />
              </div>

              <ProFormText name="phone_number" label="Phone Number" />
            </div>

            {/* Address */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Address</h2>

              <ProFormText
                name="street_address"
                label="Street Address"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ProFormText name="city" label="City" />
                <ProFormText name="state" label="State" />
                <ProFormText name="zip_code" label="Zip Code" />
              </div>
            </div>
          </ProForm>
        </Card>
      </div>
    </PageContainer>
  );
}
