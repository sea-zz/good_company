'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tag, Card, Button, Form, Input, Rate, message } from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  StarOutlined,
} from '@ant-design/icons';

interface Comment {
  id: number;
  company_id: number;
  content: string;
  rating: number;
  adder: string;
  created_at: string;
}

interface CompanyDetail {
  id: number;
  name: string;
  images: string[];
  rating: number;
  adder: string;
  city: string;
  isWeekend: boolean;
  is_overtime: boolean;
  displayRating: string;
  comments: Comment[];
}

function CompanyDetailContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('id');
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form] = Form.useForm<{ content: string; rating: number; adder: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetail();
    }
  }, [companyId]);

  const fetchCompanyDetail = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      const data = await response.json();
      if (response.ok) {
        setCompany(data);
      } else {
        setError(data.error || '获取公司详情失败');
      }
    } catch (err) {
      setError('获取公司详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (values: { content: string; rating: number; adder: string }) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/companies/${companyId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('评论添加成功！');
        form.resetFields();
        fetchCompanyDetail();
      } else {
        message.error(data.error || '添加评论失败');
      }
    } catch (err) {
      message.error('添加评论失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="detail-container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          className="back-button"
        >
          返回
        </Button>
        <Card className="error-card">
          <div className="error-message">{error || '公司不存在'}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="detail-container">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className="back-button"
      >
        返回
      </Button>

      <Card className="detail-card" hoverable>
        <div className="detail-header">
          <h1 className="detail-title">{company.name}</h1>
          <div className="detail-rating">
            <StarOutlined className="star-icon" />
            <span className="rating-value">{company.displayRating}</span>
          </div>
        </div>

        <div className="detail-meta">
          <span className="adder-info">👤 {company.adder}</span>
          <Tag icon={<EnvironmentOutlined />} color="blue">
            {company.city}
          </Tag>
          {company.isWeekend && (
            <Tag icon={<ClockCircleOutlined />} color="green">
              双休
            </Tag>
          )}
          {!company.is_overtime && company.isWeekend === false && (
            <Tag icon={<ClockCircleOutlined />} color="gray">
              单休
            </Tag>
          )}
          {!company.is_overtime && (
            <Tag icon={<WarningOutlined />} color="purple">
              不加班
            </Tag>
          )}
          {company.is_overtime && (
            <Tag icon={<WarningOutlined />} color="orange">
              加班
            </Tag>
          )}
        </div>

        <div className="detail-images">
          {company.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${company.name} - ${index + 1}`}
              className="detail-image"
            />
          ))}
        </div>
      </Card>

      <Card className="comment-card" title="添加评论">
        <Form form={form} layout="vertical" onFinish={handleSubmitComment}>
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
            <Input.TextArea
              rows={4}
              placeholder="请输入您对这家公司的评价..."
              style={{ resize: 'vertical' }}
            />
          </Form.Item>

          <Form.Item
            name="adder"
            label="您的昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入您的昵称" maxLength={50} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              disabled={isSubmitting}
              className="submit-comment-btn"
            >
              {isSubmitting ? '提交中...' : '发表评论'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        className="comment-list-card"
        title={`评论列表 (${company.comments.length}条)`}
      >
        {company.comments.length === 0 ? (
          <div className="empty-comment-state">
            <div className="empty-icon">💬</div>
            <p>暂无评论，快来发表第一条评论吧！</p>
          </div>
        ) : (
          <div className="comment-list">
            {company.comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">👤 {comment.adder}</span>
                  <Rate disabled defaultValue={comment.rating} className="comment-rate" />
                </div>
                <div className="comment-content">{comment.content}</div>
                <div className="comment-date">
                  {new Date(comment.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function CompanyDetailPage() {
  return (
    <Suspense fallback={<div className="loading">加载中...</div>}>
      <CompanyDetailContent />
    </Suspense>
  );
}