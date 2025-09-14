import { AdminDeal, ListParams, ListResult } from '../../types/admin';
import seedData from './seed/deals.json';

// In-memory storage for development
let deals: AdminDeal[] = [...seedData];

// Simulate network delay
const delay = (ms: number = 250) => new Promise(resolve => setTimeout(resolve, ms));

export async function listDeals(params: ListParams = {}): Promise<ListResult<AdminDeal>> {
  await delay();
  
  // TODO: Replace with Supabase query
  // const { data, error, count } = await supabase
  //   .from('deals')
  //   .select('*, profiles(email, display_name)', { count: 'exact' })
  //   .ilike('title', `%${params.search || ''}%`)
  //   .eq(params.userId ? 'user_id' : '', params.userId || '')
  //   .order(params.sort || 'last_edited_at', { ascending: params.dir === 'asc' })
  //   .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1)
  
  let filtered = [...deals];
  
  // User filter
  if (params.userId) {
    filtered = filtered.filter(deal => deal.userId === params.userId);
  }
  
  // Search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(deal => 
      deal.title.toLowerCase().includes(searchLower) ||
      deal.userEmail?.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort
  if (params.sort) {
    filtered.sort((a, b) => {
      const aVal = a[params.sort as keyof AdminDeal];
      const bVal = b[params.sort as keyof AdminDeal];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return params.dir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return params.dir === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }
  
  // Pagination
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const rows = filtered.slice(start, end);
  
  return {
    rows,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize)
  };
}

export async function getDeal(id: string): Promise<AdminDeal | null> {
  await delay();
  
  // TODO: Replace with Supabase query
  // const { data, error } = await supabase
  //   .from('deals')
  //   .select('*, profiles(email, display_name)')
  //   .eq('id', id)
  //   .single()
  
  return deals.find(deal => deal.id === id) || null;
}

export async function updateDeal(id: string, payload: Partial<AdminDeal>): Promise<AdminDeal> {
  await delay();
  
  const index = deals.findIndex(deal => deal.id === id);
  if (index === -1) {
    throw new Error('Deal not found');
  }
  
  const updatedDeal = {
    ...deals[index],
    ...payload,
    lastEditedAt: new Date().toISOString()
  };
  
  // TODO: Replace with Supabase update
  // const { data, error } = await supabase
  //   .from('deals')
  //   .update(payload)
  //   .eq('id', id)
  //   .select()
  //   .single()
  
  deals[index] = updatedDeal;
  return updatedDeal;
}

export async function deleteDeal(id: string): Promise<void> {
  await delay();
  
  // TODO: Replace with Supabase delete
  // const { error } = await supabase
  //   .from('deals')
  //   .delete()
  //   .eq('id', id)
  
  deals = deals.filter(deal => deal.id !== id);
}