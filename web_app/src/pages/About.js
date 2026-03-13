import React, { useEffect, useState, useMemo } from "react";
import {
  Layout,
  Row,
  Col,
  Card,
  Image,
  Typography,
  Rate,
  Avatar,
  Spin,
  Alert,
  Divider,
  Carousel,
  Button,
} from "antd";
import { UserOutlined, GoogleOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import ADD_CUSTOMER from "../assets/add_customer.jpg";
import INVOICE from "../assets/invoices.jpg";
import CONTACT from "../assets/contact.jpg";
import APPOINTMENTS from "../assets/appointments.jpg";
import CUSTOMERS from "../assets/customers.jpg";
import NESSAGES from "../assets/messages.jpg";
import SCHEDULE from "../assets/schedule.jpg";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const GOOGLE_REVIEW_URL =
  "https://g.page/r/YOUR_GOOGLE_PLACE_ID/review";

const imageCardStyle = {
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  background: "#fff",
};

const imageStyle = {
  width: "100%",
  height: 220,
  objectFit: "cover",
};
const galleryImages = [
  { src: ADD_CUSTOMER, label: "Add Customer" },
  { src: INVOICE, label: "Create Invoice" },
  { src: CONTACT, label: "Customer Contact" },
  { src: APPOINTMENTS, label: "Appointments" },
  { src: CUSTOMERS, label: "Customer Management" },
  { src: NESSAGES, label: "Messaging System" },
  { src: SCHEDULE, label: "Scheduling" },
];

const About = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------- IMAGE ARRAY ---------------- */
  const galleryImages = [
    ADD_CUSTOMER,
    INVOICE,
    CONTACT,
    APPOINTMENTS,
    CUSTOMERS,
    NESSAGES,
    SCHEDULE,
  ];

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews/?page=1");
        if (!res.ok) throw new Error("Failed to load Google reviews");
        const data = await res.json();
        setReviews(data.results || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  /* ---------------- SEO: Aggregate Rating ---------------- */
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    ).toFixed(1);
  }, [reviews]);

  /* ---------------- SEO: Schema.org JSON-LD ---------------- */
  const schemaMarkup = useMemo(() => {
    if (!reviews.length) return null;

    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Reliable Roofing & Restoration",
      image: "https://yourdomain.com/images/roof1.jpg",
      url: "https://yourdomain.com",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating,
        reviewCount: reviews.length,
      },
      review: reviews.map((r) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: r.reviewer_name || "Anonymous",
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
        },
        reviewBody: r.comment || "",
        datePublished: r.review_time,
      })),
    };
  }, [reviews, averageRating]);

  return (
    <Layout style={{ background: "#f5f5f5" }}>
      <Content style={{ maxWidth: 1200, margin: "auto", padding: "2rem" }}>
        {/* SEO Structured Data */}
        {schemaMarkup && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schemaMarkup),
            }}
          />
        )}

        {/* IMAGE GALLERY */}
        <Card bordered={false} style={{ marginBottom: 40 }}>
          <Title level={3} style={{ textAlign: "center", marginBottom: 32 }}>
            App Features
          </Title>

          <Image.PreviewGroup>
            <Row gutter={[24, 24]}>
              {galleryImages.map((img, index) => (
                <Col xs={24} sm={12} md={8} lg={8} key={index}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25 }}
                    style={imageCardStyle}
                  >
                    <Image
                      src={img}
                      preview
                      loading="lazy"
                      style={imageStyle}
                    />
                  </motion.div>
                </Col>
              ))}
            </Row>
          </Image.PreviewGroup>
        </Card>

        {/* ABOUT TEXT */}
        <Card bordered={false} style={{ marginBottom: 32 }}>
          <Title level={2}>Reliable Air & Appliance</Title>
          <Paragraph>
            This is a sample invoicing program for potential customers to sample
            the look and feel of the app before purchase. Message me with your
            preferred primary color, accent color, company name in a message and
            I will show how easily it is to convert from one company to the next.
            Click the contact tab and leave a message on the site. Inquire for
            pricing.
          </Paragraph>
        </Card>

        {/* GOOGLE REVIEWS */}
        <Card bordered={false}>
          <Row justify="space-between" align="middle">
            <Title level={3}>What Our Customers Say</Title>
            <Button
              type="primary"
              icon={<GoogleOutlined />}
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Leave Us a Review
            </Button>
          </Row>

          <Divider />

          {loading && (
            <Spin tip="Loading reviews...">
              <div style={{ minHeight: 160 }} />
            </Spin>
          )}

          {error && (
            <Alert type="error" message="Error" description={error} showIcon />
          )}

          {!loading && !error && reviews.length > 0 && (
            <Carousel autoplay dots autoplaySpeed={6000} adaptiveHeight>
              {reviews.map((review) => (
                <div key={review.review_id}>
                  <Card
                    style={{
                      maxWidth: 700,
                      margin: "0 auto",
                      textAlign: "center",
                    }}
                  >
                    <Avatar
                      src={review.profile_photo_url}
                      icon={<UserOutlined />}
                      size={64}
                      style={{ marginBottom: 16 }}
                    />

                    <Title level={5}>
                      {review.reviewer_name || "Anonymous"}
                    </Title>

                    <Rate disabled value={review.rating} />

                    {review.comment && (
                      <Paragraph
                        style={{ marginTop: 16, fontStyle: "italic" }}
                      >
                        “{review.comment}”
                      </Paragraph>
                    )}

                    <Text type="secondary">
                      {new Date(review.review_time).toLocaleDateString()}
                    </Text>
                  </Card>
                </div>
              ))}
            </Carousel>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default About;