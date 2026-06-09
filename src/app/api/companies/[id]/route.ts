import { NextRequest, NextResponse } from 'next/server';
import { getCompanyById, getCommentsByCompanyId } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id);
    
    if (isNaN(companyId)) {
      console.error(`Invalid company ID: ${params.id}`);
      return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 });
    }

    const company = await getCompanyById(companyId);

    if (!company) {
      console.error(`Company not found: ${companyId}`);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const comments = await getCommentsByCompanyId(companyId);
    
    console.log(`Fetched ${comments.length} comments for company ${companyId}`);

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
      commentCount,
    });
  } catch (error) {
    console.error(`Error fetching company ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch company',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
