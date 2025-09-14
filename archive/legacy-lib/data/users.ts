import { AdminUser, ListParams, ListResult } from '../../types/admin';
import seedData from './seed/users.json';

// In-memory storage for development
let users: AdminUser[] = [...seedData];

// Simulate network delay
const delay = (ms: number = 250) => new Promise(resolve => setTimeout(resolve, ms));

export async function listUsers(params: ListParams = {}): Promise<ListResult<AdminUser>> {
  await delay();
  
  // TODO: Replace with Supabase query
  // const { data, error, count } = await supabase
  //   .from('profiles')
  //   .select('*, deals(count)', { count: 'exact' })
  //   .ilike('email', `%${params.search || ''}%`)
  //   .order(params.sort || 'createdAt', { ascending: params.dir === 'asc' })
  //   .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1)
  
  let filtered = [...users];
  
  // Search filter
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(user => 
      user.email.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort
  if (params.sort) {
    filtered.sort((a, b) => {
      const aVal = a[params.sort as keyof AdminUser];
      const bVal = b[params.sort as keyof AdminUser];
      
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

export async function getUser(id: string): Promise<AdminUser | null> {
  await delay();
  
  // TODO: Replace with Supabase query
  // const { data, error } = await supabase
  //   .from('profiles')
  //   .select('*, deals(count)')
  //   .eq('id', id)
  //   .single()
  
  return users.find(user => user.id === id) || null;
}

export async function updateUser(id: string, payload: Partial<AdminUser>): Promise<AdminUser> {
  await delay();
  
  const index = users.findIndex(user => user.id === id);
  if (index === -1) {
    throw new Error('User not found');
  }
  
  const updatedUser = {
    ...users[index],
    ...payload
  };
  
  // TODO: Replace with Supabase update
  // const { data, error } = await supabase
  //   .from('profiles')
  //   .update(payload)
  //   .eq('id', id)
  //   .select()
  //   .single()
  
  users[index] = updatedUser;
  return updatedUser;
}