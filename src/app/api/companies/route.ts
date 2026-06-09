import { NextRequest, NextResponse } from 'next/server';
import { getCompanies, addCompany, getCommentsByCompanyId } from '@/lib/db';

// 禁用缓存，强制动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const name = searchParams.get('name');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  try {
    const { data: companies, total } = await getCompanies(city || undefined, name || undefined, page, pageSize);

    const companiesWithRating = await Promise.all(
      companies.map(async (company) => {
        const comments = await getCommentsByCompanyId(company.id);
        const commentCount = comments.length;
        let avgRating = company.rating;

        if (commentCount > 0) {
          const commentAvgRating = comments.reduce((sum, c) => sum + c.rating, 0) / commentCount;
          avgRating = (company.rating + commentAvgRating) / 2;
        }

        return {
          ...company,
          displayRating: avgRating.toFixed(1),
        };
      })
    );

    const response = NextResponse.json({
      data: companiesWithRating,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

    // 设置响应头禁用缓存
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, images, rating, adder, city, is_weekend, is_overtime } = body;

    if (!name || !images || !Array.isArray(images) || images.length === 0 || !rating || !adder || !city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = await addCompany(name, images, rating, adder, city, is_weekend , is_overtime);

    return NextResponse.json({ id, message: 'Company added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add company' }, { status: 500 });
  }
}