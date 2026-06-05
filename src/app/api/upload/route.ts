import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 允许的文件类型
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// 最大文件大小（5MB）
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 存储桶名称
const STORAGE_BUCKET = 'images';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    // 验证文件数量
    if (!files || files.length === 0) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 });
    }

    // 验证文件数量限制
    if (files.length > 10) {
      return NextResponse.json({ error: '单次最多上传10个文件' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // 验证文件类型
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ 
          error: `不支持的文件类型: ${file.type}。支持的类型: ${ALLOWED_MIME_TYPES.join(', ')}` 
        }, { status: 400 });
      }

      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `${file.name} 文件大小超过限制（最大${MAX_FILE_SIZE / 1024 / 1024}MB）` 
        }, { status: 400 });
      }

      // 验证文件名
      if (!file.name || file.name.length > 255) {
        return NextResponse.json({ error: '文件名无效或过长' }, { status: 400 });
      }

      // 生成唯一文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomStr}.${extension}`;

      try {
        // 上传到Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filename, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          
          // 如果存储服务不可用，使用base64作为备用方案
          if (uploadError.message.includes('storage.bucketNotFound') || 
              uploadError.message.includes('permission denied')) {
            
            // 将图片转换为base64存储
            const arrayBuffer = await file.arrayBuffer();
            const base64String = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
            uploadedUrls.push(base64String);
            console.log(`使用base64备用方案上传: ${filename}`);
            continue;
          }
          
          return NextResponse.json({ 
            error: `上传文件失败: ${uploadError.message}` 
          }, { status: 500 });
        }

        // 获取文件URL
        const { data: urlData } = await supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filename);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
          console.log(`文件上传成功: ${filename}`);
        } else {
          // 备用方案：使用base64
          const arrayBuffer = await file.arrayBuffer();
          const base64String = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
          uploadedUrls.push(base64String);
          console.log(`使用base64备用方案: ${filename}`);
        }
      } catch (uploadException) {
        console.error('上传过程异常:', uploadException);
        
        // 备用方案：使用base64
        try {
          const arrayBuffer = await file.arrayBuffer();
          const base64String = `data:${file.type};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
          uploadedUrls.push(base64String);
          console.log(`使用base64备用方案处理异常: ${filename}`);
        } catch (e) {
          return NextResponse.json({ 
            error: `处理文件失败: ${filename}` 
          }, { status: 500 });
        }
      }
    }

    console.log(`成功上传 ${uploadedUrls.length} 个文件`);
    return NextResponse.json({ urls: uploadedUrls });
    
  } catch (error) {
    console.error('上传API异常:', error);
    return NextResponse.json({ error: '上传API异常' }, { status: 500 });
  }
}
