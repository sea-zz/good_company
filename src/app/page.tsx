'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  Button,
  Input,
  Select,
  Pagination,
  Card,
  Tag,
  Form,
  message,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UploadOutlined,
  StarOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
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
  is_weekend: boolean;
  is_overtime: boolean;
}

export default function HomePage() {
  const [searchName, setSearchName] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<AddCompanyForm>();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pageSize = 5;

  const allCities = provinces.flatMap((p) => [p.name, ...p.cities.map((c) => c.name)]);
  const cityOptions = allCities.map((city) => ({
    value: city,
    label: city,
  }));

  useEffect(() => {
    fetchCompanies(1);
  }, [searchName, selectedCity]);

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

  const handlePageChange = (page: number) => {
    fetchCompanies(page);
  };

  const handleCompanyClick = (companyId: number) => {
    router.push(`/company/detail?id=${companyId}`);
  };

  const uploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const currentImages = form.getFieldValue('images') || [];
    if (currentImages.length + files.length > 10) {
      message.error('最多只能上传10张图片');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.urls) {
        form.setFieldValue('images', [...currentImages, ...data.urls]);
        message.success(`成功上传 ${data.urls.length} 张图片`);
      } else {
        message.error(data.error || '图片上传失败');
      }
    } catch (err) {
      message.error('图片上传失败，请检查网络连接');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const images = form.getFieldValue('images') || [];
    form.setFieldValue('images', images.filter((_: string, i: number) => i !== index));
  };

  const handleSubmit = async (values: AddCompanyForm) => {
    setUploading(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        message.success('公司添加成功！');
        form.resetFields();
        setDrawerOpen(false);
        fetchCompanies(1);
      } else {
        message.error(data.error || '添加公司失败');
      }
    } catch (err) {
      message.error('添加公司失败，请检查网络连接');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="header">
        <h1 className="title">
          <span className="logo">🏢</span> Good Company
        </h1>
        <div className="search-section">
          <Input
            placeholder="公司名模糊查询"
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
            prefix={<SearchIcon />}
          />
          <Select
            placeholder="地市查询"
            value={selectedCity || undefined}
            onChange={(value) => {
              setSelectedCity(value || '');
              setCurrentPage(1);
            }}
            className="city-select"
            options={cityOptions}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 200 }}
          />
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
          className="add-btn"
        >
          添加公司
        </Button>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : companies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无公司信息</p>
          <p style={{ fontSize: '14px', marginTop: '8px', color: '#999' }}>
            点击右上角添加公司
          </p>
        </div>
      ) : (
        <>
          <div className="company-list">
            {companies.map((company) => (
              <Card
                key={company.id}
                className="company-card"
                onClick={() => handleCompanyClick(company.id)}
                hoverable
              >
                <div className="company-header">
                  <h3 className="company-name">{company.name}</h3>
                  <div className="company-rating">
                    <StarOutlined className="star" />
                    <span>{company.displayRating}</span>
                  </div>
                </div>
                <div className="company-meta">
                  <Tag icon={<EnvironmentOutlined />} color="blue">
                    {company.city}
                  </Tag>
                  {company.is_weekend && (
                    <Tag icon={<ClockCircleOutlined />} color="green">
                      双休
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
                <div className="company-images">
                  {company.images.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={company.name}
                      className="company-image"
                    />
                  ))}
                  {company.images.length > 3 && (
                    <div className="more-images">+{company.images.length - 3}</div>
                  )}
                </div>
                <div className="company-footer">
                  <span className="adder">添加人：{company.adder}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="pagination-container">
            <Pagination
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }
            />
          </div>
        </>
      )}

      <Drawer
        title="添加公司"
        placement="right"
        width={480}
        onClose={() => {
          setDrawerOpen(false);
          form.resetFields();
        }}
        open={drawerOpen}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ is_weekend: '0', is_overtime: '0' }}>
          <Form.Item
            name="name"
            label="公司名称"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="images"
            label="公司环境图片"
            rules={[
              { required: true, message: '请上传至少一张图片' },
              {
                validator(_, value) {
                  if (!value || !Array.isArray(value) || value.length === 0) {
                    return Promise.reject(new Error('请上传至少一张图片'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  uploadFiles(Array.from(files));
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              style={{
                border: '2px dashed #d9d9d9',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.3s',
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#d9d9d9';
              }}
            >
              <UploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                {uploading ? '上传中...' : '点击或拖拽文件到此处上传'}
              </p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                支持 JPG、PNG、GIF、WebP 格式，最多10张
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  uploadFiles(Array.from(files));
                }
              }}
              disabled={uploading}
            />
            <div className="image-preview">
              {form.getFieldValue('images')?.map((img: string, index: number) => (
                <div key={index} className="preview-item">
                  <img src={img} alt={`预览 ${index + 1}`} />
                  <Button
                    danger
                    size="small"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </Form.Item>

          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Select
              placeholder="请选择评分"
              options={[
                { value: 1, label: '1星' },
                { value: 2, label: '2星' },
                { value: 3, label: '3星' },
                { value: 4, label: '4星' },
                { value: 5, label: '5星' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="adder"
            label="添加人昵称"
            rules={[{ required: true, message: '请输入添加人昵称' }]}
          >
            <Input placeholder="请输入您的昵称" maxLength={50} />
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
              disabled={uploading}
              style={{ width: '100%' }}
            >
              {uploading ? '提交中...' : '确定'}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

function SearchIcon() {
  return <span>🔍</span>;
}