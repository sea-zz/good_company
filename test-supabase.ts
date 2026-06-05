// 测试脚本：验证Supabase连接和存储功能
// 使用方法：npx tsx test-supabase.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function testSupabaseConnection() {
  console.log('🚀 开始测试Supabase连接...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 环境变量未配置！');
    console.error(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '已设置' : '未设置'}`);
    console.error(`  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${supabaseKey ? '已设置' : '未设置'}`);
    process.exit(1);
  }

  console.log('✅ 环境变量配置正确');
  console.log(`  URL: ${supabaseUrl}`);
  console.log(`  Key: ${supabaseKey?.substring(0, 10)}...`);

  // 创建Supabase客户端
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 测试连接
  console.log('\n🔌 测试Supabase连接...');
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ 连接失败:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Supabase连接成功');
  } catch (err) {
    console.error('❌ 连接异常:', err);
    process.exit(1);
  }

  // 测试存储桶
  const bucketName = 'images';
  console.log(`\n📦 测试存储桶 '${bucketName}'...`);
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ 获取存储桶列表失败:', error.message);
      process.exit(1);
    }

    const bucketExists = buckets.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.warn(`⚠️ 存储桶 '${bucketName}' 不存在，需要创建`);
      console.log('   请在Supabase控制台创建存储桶或执行以下操作：');
      console.log('   1. 登录Supabase控制台');
      console.log('   2. 进入Storage页面');
      console.log('   3. 创建名为"images"的存储桶');
      console.log('   4. 设置存储桶为公开（Public）');
    } else {
      console.log(`✅ 存储桶 '${bucketName}' 存在`);
      
      // 测试上传权限
      console.log('\n📤 测试文件上传权限...');
      const testContent = 'Test file content';
      const testFile = new Blob([testContent], { type: 'text/plain' });
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload('test_upload.txt', testFile);
      
      if (uploadError) {
        console.error('❌ 上传权限测试失败:', uploadError.message);
        console.log('   请检查存储桶的RLS策略设置');
      } else {
        console.log('✅ 文件上传权限测试通过');
        
        // 测试获取URL（getPublicUrl不返回error）
        const { data: urlData } = await supabase.storage
          .from(bucketName)
          .getPublicUrl('test_upload.txt');
        
        if (!urlData?.publicUrl) {
          console.error('❌ 获取文件URL失败');
        } else {
          console.log(`✅ 获取文件URL成功: ${urlData.publicUrl}`);
          
          // 清理测试文件
          const { error: deleteError } = await supabase.storage
            .from(bucketName)
            .remove(['test_upload.txt']);
          
          if (deleteError) {
            console.warn('⚠️ 清理测试文件失败:', deleteError.message);
          } else {
            console.log('✅ 测试文件已清理');
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ 存储测试异常:', err);
    process.exit(1);
  }

  // 测试数据库表
  console.log('\n🗄️ 测试数据库表...');
  
  try {
    // 测试companies表
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      console.error('❌ companies表查询失败:', companiesError.message);
      console.log('   请确保已创建companies表（参考supabase-schema.sql）');
    } else {
      console.log('✅ companies表查询成功');
    }
    
    // 测试comments表
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);
    
    if (commentsError) {
      console.error('❌ comments表查询失败:', commentsError.message);
      console.log('   请确保已创建comments表（参考supabase-schema.sql）');
    } else {
      console.log('✅ comments表查询成功');
    }
  } catch (err) {
    console.error('❌ 数据库测试异常:', err);
    process.exit(1);
  }

  console.log('\n🎉 所有测试完成！');
  console.log('\n📋 检查清单:');
  console.log('  ✅ Supabase连接配置正确');
  console.log('  ✅ 存储桶存在（或需要创建）');
  console.log('  ✅ 数据库表存在（或需要创建）');
  console.log('\n📝 下一步操作:');
  console.log('  1. 在Supabase控制台创建"images"存储桶并设置为公开');
  console.log('  2. 执行supabase-schema.sql创建数据库表');
  console.log('  3. 配置存储桶的RLS策略允许上传');
  console.log('  4. 运行 npm run dev 启动应用');
}

testSupabaseConnection().catch(err => {
  console.error('❌ 测试脚本异常:', err);
  process.exit(1);
});
