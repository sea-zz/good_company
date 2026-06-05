-- 在Supabase SQL编辑器中执行此脚本创建表

-- 创建companies表
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  images TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  adder TEXT NOT NULL,
  city TEXT NOT NULL,
  is_weekend TEXT DEFAULT '0',
  is_overtime TEXT DEFAULT '0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建comments表
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  adder TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略，允许所有人读取
CREATE POLICY "Allow public read access" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON comments
  FOR SELECT USING (true);

-- 创建RLS策略，允许所有人插入
CREATE POLICY "Allow public insert access" ON companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access" ON comments
  FOR INSERT WITH CHECK (true);
