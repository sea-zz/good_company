import { NextRequest, NextResponse } from 'next/server';
import { getCompanyById, getCommentsByCompanyId } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id);
    const company = await getCompanyById(companyId);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const comments = await getCommentsByCompanyId(companyId);

    const commentCount = comments.length;
    let avgRating = company.rating;

    if (commentCount > 0) {
      const commentAvgRating = comments.reduce((sum, c) => sum + c.rating, 0) / commentCount;
      avgRating = (company.rating + commentAvgRating) / 2;
    }

    return NextResponse.json({
      ...company,
      displayRating: avgRating.toFixed(1),
      comments,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 });
  }
}
