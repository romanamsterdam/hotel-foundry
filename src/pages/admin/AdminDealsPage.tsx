import React, { useState, useEffect } from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/toast';
import AdminTable, { Column } from '../../components/admin/AdminTable';
import { AdminDeal, ListParams } from '../../types/admin';
import { listDeals } from '../../lib/data/deals';
import { formatCurrency, formatPercent, isoToDate } from '../../lib/format';

export default function AdminDealsPage() {
  const { toast } = useToast();
  const [deals, setDeals] = useState<AdminDeal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('lastEditedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);

  // Get userId filter from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const userIdFilter = urlParams.get('userId');

  const loadDeals = async () => {
    setLoading(true);
    try {
      const params: ListParams = {
        search: search || undefined,
        sort,
        dir: sortDir,
        page,
        pageSize,
        userId: userIdFilter || undefined
      };
      
      const result = await listDeals(params);
      setDeals(result.rows);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [page, pageSize, search, sort, sortDir, userIdFilter]);

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

  const handleInspect = (dealId: string) => {
    window.open(`/admin/deals/${dealId}/inspect`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenDeal = (dealId: string) => {
    // TODO: Enable when Supabase auth supports impersonation
    // For now, just show a tooltip
    toast.info('Impersonation feature coming with Supabase auth');
  };

  const columns: Column<AdminDeal>[] = [
    {
      key: 'title',
      label: 'Deal Title',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-slate-900">{value}</div>
          <div className="text-sm text-slate-500">ID: {row.id.slice(0, 8)}</div>
        </div>
      )
    },
    {
      key: 'userEmail',
      label: 'Owner',
      sortable: true,
      render: (value) => (
        <span className="text-slate-700">{value || '—'}</span>
      )
    },
    {
      key: 'lastEditedAt',
      label: 'Last Edited',
      sortable: true,
      render: (value) => (
        <span className="text-slate-600">{isoToDate(value)}</span>
      )
    },
    {
      key: 'totalProjectCost',
      label: 'Total Cost',
      sortable: true,
      className: 'text-right',
      render: (value) => (
        <span className="font-medium text-slate-900">
          {value ? formatCurrency(value, 'EUR') : '—'}
        </span>
      )
    },
    {
      key: 'projectIRR',
      label: 'Project IRR',
      sortable: true,
      className: 'text-right',
      render: (value) => (
        <span className={`font-medium ${
          value ? (value >= 0.15 ? 'text-green-600' : value >= 0.10 ? 'text-amber-600' : 'text-red-600') : 'text-slate-500'
        }`}>
          {value ? formatPercent(value) : '—'}
        </span>
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
            onClick={() => handleInspect(row.id)}
            className="flex items-center space-x-1"
          >
            <Eye className="h-3 w-3" />
            <span>Inspect</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenDeal(row.id)}
            disabled
            className="flex items-center space-x-1 opacity-50"
            title="Coming with Supabase auth"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Open</span>
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
          <h2 className="text-xl font-semibold text-slate-900">Deals</h2>
          <p className="text-sm text-slate-600">
            View all user deals with key metrics and inspection tools
            {userIdFilter && (
              <span className="ml-2">
                <Badge variant="secondary">Filtered by user</Badge>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        rows={deals}
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
        emptyMessage="No deals found."
      />
    </div>
  );
}