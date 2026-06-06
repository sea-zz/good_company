'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Tag, Button, Form, Input, Rate, message, Spin } from 'antd';
import { ArrowLeftOutlined, StarOutlined, ClockCircleOutlined, WarningOutlined, EnvironmentOutlined, SendOutlined } from '@ant-design/icons';

interface Company {
  id: number;
  name: string;
  images: string[];
  rating: number;
  adder: string;
  city: string;
  is_weekend: string;
  is_overtime: string;
  displayRating: string;
  created_at: string;
}

interface Comment {
  id: number;
  company_id: number;
  content: string;
  rating: number;
  adder: string;
  created_at: string;
}

export default function MobileCompanyDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm<{ content: string; rating: number; adder: string }>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompany();
    fetchComments();
  }, [params.id]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      } else {
        message.error('获取公司信息失败');
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
      message.error('获取公司信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/companies/${params.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSubmit = async (values: { content: string; rating: number; adder: string }) => {
    if (!values.content || !values.rating || !values.adder) {
      message.error('请填写完整评论信息');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/companies/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('评论成功');
        form.resetFields();
        fetchComments();
        fetchCompany();
      } else {
        const errorData = await response.json();
        message.error(errorData.error || '评论失败');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      message.error('评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarOutlined
        key={i}
        style={{
          color: i < Math.round(rating) ? '#FFD700' : '#E5E5E5',
          fontSize: '14px',
        }}
      />
    ));
  };

  if (loading) {
    return (
      <div className="mobile-detail-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="mobile-detail-container">
        <Button onClick={() => router.push('/mobile')} className="mobile-back-btn">
          <ArrowLeftOutlined /> 返回
        </Button>
        <div className="mobile-detail-empty">
          <p>公司不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-detail-container">
      <Button onClick={() => router.push('/mobile')} className="mobile-back-btn">
        <ArrowLeftOutlined /> 返回
      </Button>

      <Card className="mobile-detail-card">
        <div className="mobile-detail-header">
          <div className="mobile-detail-images">
            {company.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${company.name}-${index}`}
                className="mobile-detail-image"
                loading="lazy"
              />
            ))}
          </div>
        </div>

        <div className="mobile-detail-info">
          <div className="mobile-detail-title-row">
            <h1 className="mobile-detail-title">{company.name}</h1>
            <div className="mobile-detail-rating">
              {renderRating(parseFloat(company.displayRating))}
              <span className="mobile-detail-rating-text">({company.displayRating})</span>
            </div>
          </div>

          <div className="mobile-detail-tags">
            <Tag icon={<EnvironmentOutlined />} color="blue">
              {company.city}
            </Tag>
            {company.is_weekend === '1' ? (
              <Tag icon={<ClockCircleOutlined />} color="green">双休</Tag>
            ) : (
              <Tag icon={<ClockCircleOutlined />} color="orange">单休</Tag>
            )}
            {company.is_overtime === '1' ? (
              <Tag icon={<WarningOutlined />} color="red">加班</Tag>
            ) : (
              <Tag icon={<WarningOutlined />} color="purple">不加班</Tag>
            )}
          </div>

          <div className="mobile-detail-meta">
            <span>添加人: {company.adder}</span>
            <span>创建时间: {new Date(company.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>

      <Card className="mobile-comment-card" title="用户评论">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="adder"
            label="您的昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate defaultValue={0} />
          </Form.Item>

          <Form.Item
            name="content"
            label="评论内容"
            rules={[{ required: true, message: '请输入评论内容' }]}
          >
            <Input.TextArea placeholder="请输入评论内容" rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              <SendOutlined /> 发表评论
            </Button>
          </Form.Item>
        </Form>

        <div className="mobile-comment-list">
          {comments.length === 0 ? (
            <div className="mobile-comment-empty">
              <p>暂无评论，快来发表第一条评论吧！</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="mobile-comment-item">
                <div className="mobile-comment-header">
                  <span className="mobile-comment-adder">{comment.adder}</span>
                  <div className="mobile-comment-rating">
                    {renderRating(comment.rating)}
                  </div>
                </div>
                <p className="mobile-comment-content">{comment.content}</p>
                <span className="mobile-comment-time">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
