import { supabase } from './supabase';

export interface Company {
  id: number;
  name: string;
  images: string[];
  rating: number;
  adder: string;
  city: string;
  isWeekend: boolean;
  isOverTime: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  company_id: number;
  content: string;
  rating: number;
  adder: string;
  created_at: string;
}

export interface PaginatedCompanies {
  data: Company[];
  total: number;
}

export async function getCompanies(
  city?: string,
  name?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedCompanies> {
  try {
    let query = supabase.from('companies').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (city && name) {
      query = query.or(`city.eq.${city},name.ilike.%${name}%`);
    } else if (city) {
      query = query.eq('city', city);
    } else if (name) {
      query = query.ilike('name', `%${name}%`);
    }

    const { data, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Error fetching companies:', error);
      throw new Error('Failed to fetch companies');
    }

    return {
      data: (data || []).map(company => ({
        ...company,
        images: typeof company.images === 'string' ? JSON.parse(company.images) : company.images,
        isWeekend: company.isWeekend === '1',
        isOverTime: company.isOverTime === '1',
      })),
      total: count || 0,
    };
  } catch (error) {
    console.error('Error in getCompanies:', error);
    throw error;
  }
}

export async function getCompanyById(id: number): Promise<Company | null> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      throw new Error('Failed to fetch company');
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      images: typeof data.images === 'string' ? JSON.parse(data.images) : data.images,
      is_weekend: data.is_weekend === '1' ? '1' : '0',
      is_overtime: data.is_overtime === '1' ? '1' : '0',
    };
  } catch (error) {
    console.error('Error in getCompanyById:', error);
    throw error;
  }
}

export async function addCompany(
  name: string,
  images: string[],
  rating: number,
  adder: string,
  city: string,
  isWeekend: string,
  isOverTime: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([
        {
          name,
          images: JSON.stringify(images),
          rating,
          adder,
          city,
          is_weekend: isWeekend,
          is_overtime: isOverTime,
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error adding company:', error);
      throw new Error('Failed to add company');
    }

    return data.id;
  } catch (error) {
    console.error('Error in addCompany:', error);
    throw error;
  }
}

export async function getCommentsByCompanyId(companyId: number): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCommentsByCompanyId:', error);
    throw error;
  }
}

export async function addComment(
  companyId: number,
  content: string,
  rating: number,
  adder: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          company_id: companyId,
          content,
          rating,
          adder,
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }

    return data.id;
  } catch (error) {
    console.error('Error in addComment:', error);
    throw error;
  }
}

export async function companyExists(id: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error checking company exists:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in companyExists:', error);
    return false;
  }
}