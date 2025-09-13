import React, { useMemo, useEffect, useState } from "react";
import { useConsultingStore } from "../../lib/consulting/store";
import { StatusBadge, statusLabel } from "../../lib/consulting/ui";
import type { ConsultingRequest, ConsultingStatus } from "../../types/consulting";
import { CONSULTING_AREAS } from "../../constants/consulting";

import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { MoreHorizontal, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";

const AREAS = CONSULTING_AREAS.map(key => ({
  key,
  label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  description: `${key.replace(/_/g, ' ')} consulting services`
}));

export default function ConsultingRequestsPage() {
  const {
    items, init, q, setQuery, statusFilter, setStatusFilter, unreadOnly, setUnreadOnly,
    setAssignee, setStatus, toggleUnread, remove, add
  } = useConsultingStore();

  useEffect(() => { init(); }, [init]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items
      .filter(it => statusFilter === "all" ? true : it.status === statusFilter)
      .filter(it => (unreadOnly ? it.unread : true))
      .filter(it => {
        if (!ql) return true;
        return [it.id, it.title, it.company, it.contactName, it.email, it.assignee, it.country, it.tags?.join(" ")]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(ql);
      })
      .sort((a,b) => (b.createdAt.localeCompare(a.createdAt)));
  }, [items, q, statusFilter, unreadOnly]);

  const statuses: { value: ConsultingStatus | "all"; label: string }[] = [
    { value: "all", label: "All statuses" },
    { value: "unread", label: statusLabel.unread },
    { value: "proposal_submitted", label: statusLabel.proposal_submitted },
    { value: "in_progress", label: statusLabel.in_progress },
    { value: "completed", label: statusLabel.completed },
    { value: "declined", label: statusLabel.declined },
  ];

  const handleNewRequest = (formData: FormData) => {
    const id = (formData.get("id") as string) || `REQ-${Math.floor(Math.random()*90000)+10000}`;
    const req: ConsultingRequest = {
      id,
      title: String(formData.get("title") || "Untitled request"),
      company: String(formData.get("company") || ""),
      contactName: String(formData.get("contactName") || ""),
      email: String(formData.get("email") || ""),
      country: String(formData.get("country") || ""),
      budget: Number(formData.get("budget") || 0),
      currency: String(formData.get("currency") || "EUR"),
      createdAt: new Date().toISOString(),
      status: "unread",
      assignee: "",
      unread: true,
      notes: String(formData.get("notes") || "")
    };
    add(req);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Consulting Requests</h2>
        <p className="text-sm text-slate-600">
          Manage incoming consulting requests and proposals
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company, contact, tag…"
            className="w-[320px]"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status filter" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => (
                <SelectItem key={s.value} value={s.value as string}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={unreadOnly ? "default" : "outline"}
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            {unreadOnly ? "Showing unread" : "Unread only"}
          </Button>
        </div>
        <NewRequestDialog onSubmit={handleNewRequest} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-700 w-[120px]">ID</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Title</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Company</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Created</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Assignee</th>
                <th className="text-center py-3 px-4 font-medium text-slate-700 w-[60px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className={`border-b border-slate-100 hover:bg-slate-50 ${it.unread ? "bg-amber-50" : ""}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {it.unread && <Badge variant="secondary" className="text-xs">New</Badge>}
                      }
                      <span className="font-medium text-slate-900">{it.id}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{it.title}</div>
                    <div className="text-xs text-slate-500">{it.email}</div>
                    {it.tags && it.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {it.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{it.company || "—"}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {new Date(it.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Select value={it.status} onValueChange={(v) => setStatus(it.id, v as ConsultingStatus)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabel).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      defaultValue={it.assignee || ""}
                      onBlur={(e) => setAssignee(it.id, e.target.value)}
                      placeholder="Type consultant name"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <RowActions
                      id={it.id}
                      currentStatus={it.status}
                      onSetStatus={(s) => setStatus(it.id, s)}
                      onToggleUnread={() => toggleUnread(it.id)}
                      onDelete={() => remove(it.id)}
                      isUnread={!!it.unread}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-10">
                    No requests match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{items.length}</div>
            <div className="text-sm text-slate-600">Total</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {items.filter(r => r.status === 'unread').length}
            </div>
            <div className="text-sm text-slate-600">Unread</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {items.filter(r => r.status === 'proposal_submitted').length}
            </div>
            <div className="text-sm text-slate-600">Proposals</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {items.filter(r => r.status === 'in_progress').length}
            </div>
            <div className="text-sm text-slate-600">In Progress</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {items.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({
  id, currentStatus, onSetStatus, onToggleUnread, onDelete, isUnread
}: {
  id: string;
  currentStatus: ConsultingStatus;
  onSetStatus: (s: ConsultingStatus) => void;
  onToggleUnread: () => void;
  onDelete: () => void;
  isUnread: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowMenu(!showMenu)}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {showMenu && (
        <div className="absolute right-0 top-8 z-50 w-48 rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="p-1">
            <div className="px-2 py-1 text-xs text-slate-500">Set status</div>
            {Object.entries(statusLabel).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  onSetStatus(key as ConsultingStatus);
                  setShowMenu(false);
                }}
                className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 rounded"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-slate-200 my-1"></div>
            <button
              onClick={() => {
                onToggleUnread();
                setShowMenu(false);
              }}
              className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 rounded flex items-center"
            >
              {isUnread ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {isUnread ? "Mark as read" : "Mark as unread"}
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete request ${id}?`)) {
                  onDelete();
                }
                setShowMenu(false);
              }}
              className="w-full text-left px-2 py-1 text-sm hover:bg-slate-100 rounded text-red-600 flex items-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewRequestDialog({ onSubmit }: { onSubmit: (formData: FormData) => void }) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
    setOpen(false);
    e.currentTarget.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New consulting request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Custom ID (optional)
              </label>
              <Input name="id" placeholder="REQ-24004" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title *
              </label>
              <Input name="title" required placeholder="Brief description" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company
              </label>
              <Input name="company" placeholder="Company name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Name
              </label>
              <Input name="contactName" placeholder="Contact person" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <Input name="email" type="email" placeholder="contact@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Country
              </label>
              <Input name="country" placeholder="ES, PT, IT..." />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Budget
              </label>
              <Input name="budget" type="number" min="0" step="0.01" placeholder="5000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency
              </label>
              <Input name="currency" placeholder="EUR" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea 
              name="notes" 
              placeholder="Additional details..." 
              className="w-full min-h-[96px] rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Request</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}