'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  Pagination,
  Card,
  Tag,
  Drawer,
  Form,
  message,
  Spin,
  Rate,
} from 'antd';
import { PlusOutlined, SearchOutlined, StarOutlined, ClockCircleOutlined, WarningOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { provinces } from '@/lib/cities';

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
}

interface AddCompanyForm {
  name: string;
  images: string[];
  rating: number;
  adder: string;
  city: string;
  is_weekend: string;
  is_overtime: string;
}

export default function MobileHomePage() {
  const [searchName, setSearchName] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<AddCompanyForm>();
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const pageSize = 5;

  const allCities = provinces.flatMap((p) => p.cities.length > 0 ? p.cities.map((c) => c.name) : [p.name]);
  const cityOptions = allCities.map((city) => ({
    value: city,
    label: city,
  }));

  const fetchCompanies = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchName) params.append('name', searchName);
      if (selectedCity) params.append('city', selectedCity);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const url = `/api/companies?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      setCompanies(data.data || []);
      setTotal(data.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      message.error('获取公司列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(1);
  }, [searchName, selectedCity]);

  const handleSubmit = async (values: AddCompanyForm) => {
    if (!values.name || !values.images || values.images.length === 0 || !values.rating || !values.adder || !values.city) {
      message.error('请填写完整信息');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('添加公司成功');
        setDrawerOpen(false);
        form.resetFields();
        fetchCompanies(1);
      } else {
        const errorData = await response.json();
        message.error(errorData.error || '添加公司失败');
      }
    } catch (error) {
      console.error('Failed to add company:', error);
      message.error('添加公司失败');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        return result.url;
      });

      const urls = await Promise.all(uploadPromises);
      form.setFieldValue('images', urls);
    } catch (error) {
      console.error('Failed to upload images:', error);
      message.error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const renderRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarOutlined
        key={i}
        style={{
          color: i < Math.round(rating) ? '#FFD700' : '#E5E5E5',
          fontSize: '16px',
        }}
      />
    ));
  };

  return (
    <div className="mobile-container">
      <div className="mobile-header">
        <h1 className="mobile-title">
          <span>🏢</span> 好公司
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
          className="mobile-add-btn"
        >
          添加
        </Button>
      </div>

      <div className="mobile-search-section">
        <Input
          placeholder="搜索公司"
          value={searchName}
          onChange={(e) => {
            setSearchName(e.target.value);
            setCurrentPage(1);
          }}
          className="mobile-search-input"
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="选择城市"
          value={selectedCity || undefined}
          onChange={(value) => {
            setSelectedCity(value || '');
            setCurrentPage(1);
          }}
          className="mobile-city-select"
          options={cityOptions}
          allowClear
          showSearch
          optionFilterProp="label"
        />
      </div>

      {loading ? (
        <div className="mobile-loading">
          <Spin size="large" />
        </div>
      ) : companies.length === 0 ? (
        <div className="mobile-empty">
          <div>📭</div>
          <p>暂无公司信息</p>
        </div>
      ) : (
        <div className="mobile-company-list">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="mobile-company-card"
              onClick={() => router.push(`/mobile/company/detail/${company.id}`)}
            >
              <div className="mobile-card-header">
                <div className="mobile-card-images">
                  {company.images.length > 0 ? (
                    <img
                      src={company.images[0]}
                      alt={company.name}
                      className="mobile-card-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="mobile-card-image-placeholder">📷</div>
                  )}
                </div>
                <div className="mobile-card-info">
                  <h3 className="mobile-card-name">{company.name}</h3>
                  <div className="mobile-card-tags">
                    <Tag icon={<EnvironmentOutlined />} color="blue" className="mobile-tag">
                      {company.city}
                    </Tag>
                    {company.is_weekend === '1' && (
                      <Tag icon={<ClockCircleOutlined />} color="green" className="mobile-tag">
                        双休
                      </Tag>
                    )}
                    {company.is_weekend !== '1' && (
                      <Tag icon={<ClockCircleOutlined />} color="orange" className="mobile-tag">
                        单休
                      </Tag>
                    )}
                    {company.is_overtime === '1' ? (
                      <Tag icon={<WarningOutlined />} color="red" className="mobile-tag">
                        加班
                      </Tag>
                    ) : (
                      <Tag icon={<WarningOutlined />} color="purple" className="mobile-tag">
                        不加班
                      </Tag>
                    )}
                  </div>
                  <div className="mobile-card-rating">
                    {renderRating(parseFloat(company.displayRating))}
                    <span className="mobile-rating-text">({company.displayRating})</span>
                  </div>
                </div>
              </div>
              <div className="mobile-card-footer">
                <span className="mobile-card-adder">添加人: {company.adder}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && companies.length > 0 && (
        <div className="mobile-pagination">
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={(page) => fetchCompanies(page)}
            showSizeChanger={false}
            showQuickJumper
            simple
          />
        </div>
      )}

      <Drawer
        title="添加公司"
        placement="right"
        onClose={() => {
          setDrawerOpen(false);
          form.resetFields();
        }}
        open={drawerOpen}
        width="400px"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="公司名称"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>

          <Form.Item
            name="images"
            label="公司图片"
            rules={[{ required: true, message: '请上传至少一张图片' }]}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="mobile-image-upload"
            />
            <p className="mobile-upload-hint">点击选择图片，支持多张上传</p>
          </Form.Item>

          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate defaultValue={0} />
          </Form.Item>

          <Form.Item
            name="adder"
            label="添加人"
            rules={[{ required: true, message: '请输入添加人' }]}
          >
            <Input placeholder="请输入添加人" />
          </Form.Item>

          <Form.Item
            name="city"
            label="城市"
            rules={[{ required: true, message: '请选择城市' }]}
          >
            <Select
              placeholder="请选择城市"
              options={cityOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="is_weekend" label="是否双休">
            <Select placeholder="请选择" options={[
              { label: '不双休', value: '0' },
              { label: '双休', value: '1' },
            ]} />
          </Form.Item>

          <Form.Item name="is_overtime" label="是否加班">
            <Select placeholder="请选择" options={[
              { label: '不加班', value: '0' },
              { label: '加班', value: '1' },
            ]} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploading}
              block
            >
              {uploading ? '提交中...' : '提交'}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
