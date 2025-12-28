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

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const GOOGLE_REVIEW_URL =
  "https://g.page/r/YOUR_GOOGLE_PLACE_ID/review";

const About = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <Card bordered={false} style={{ marginBottom: 32 }}>
          <Image.PreviewGroup>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Image src="/images/roof1.jpg" />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Image src="/images/roof2.jpg" />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Image src="/images/roof3.jpg" />
              </Col>
            </Row>
          </Image.PreviewGroup>
        </Card>

        {/* ABOUT TEXT */}
        <Card bordered={false} style={{ marginBottom: 32 }}>
          <Title level={2}>Reliable Roofing & Restoration</Title>
          <Paragraph>
            Reliable Roofing & Restoration is a professional roofing and storm
            restoration company specializing in roof replacements, emergency
            repairs, and insurance claim assistance. We are committed to quality,
            integrity, and dependable service.
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
                      <Paragraph style={{ marginTop: 16, fontStyle: "italic" }}>
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
