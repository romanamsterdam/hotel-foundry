import React, { useState, useEffect } from 'react';
import { ExternalLink, Crown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/toast';
import AdminTable, { Column } from '../../components/admin/AdminTable';
import { AdminUser, ListParams } from '../../types/admin';
import { listUsers } from '../../lib/data/users';
import { isoToDate } from '../../lib/format';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: ListParams = {
        search: search || undefined,
        sort,
        dir: sortDir,
        page,
        pageSize
      };
      
      const result = await listUsers(params);
      setUsers(result.rows);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, search, sort, sortDir]);

  const handleSort = (column: string) => {
    if (sort === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(column);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleSearch = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handleViewDeals = (userId: string) => {
    window.open(`/admin/deals?userId=${userId}`, '_blank', 'noopener,noreferrer');
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'displayName',
      label: 'User',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-slate-900">{value || 'Unknown'}</span>
            {row.role === 'admin' && (
              <Crown className="h-4 w-4 text-yellow-500" title="Administrator" />
            )}
          </div>
          <div className="text-sm text-slate-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'admin' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-slate-600">{isoToDate(value)}</span>
      )
    },
    {
      key: 'lastActiveAt',
      label: 'Last Active',
      sortable: true,
      render: (value) => (
        <span className="text-slate-600">{isoToDate(value)}</span>
      )
    },
    {
      key: 'dealsCount',
      label: 'Deals',
      sortable: true,
      className: 'text-right',
      render: (value) => (
        <span className="font-medium text-slate-900">{value}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDeals(row.id)}
            className="flex items-center space-x-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span>View Deals</span>
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Users</h2>
          <p className="text-sm text-slate-600">
            Manage registered users and their activity
          </p>
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        rows={users}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        search={search}
        sort={sort}
        sortDir={sortDir}
        loading={loading}
        onSearch={handleSearch}
        onSort={handleSort}
        onPageChange={setPage}
        onPageSizeChange={(newPageSize) => {
          setPageSize(newPageSize);
          setPage(1);
        }}
        emptyMessage="No users found."
      />
    </div>
  );
}