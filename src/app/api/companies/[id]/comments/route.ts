import { NextRequest, NextResponse } from 'next/server';
import { addComment, companyExists } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = parseInt(params.id);
    const exists = await companyExists(companyId);

    if (!exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content, rating, adder } = body;

    if (!content || !rating || !adder) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = await addComment(companyId, content, rating, adder);

    return NextResponse.json({ id, message: 'Comment added successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
