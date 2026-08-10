import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Link as LinkType, PaginatedResponse } from '../types';
import { Plus, Search, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import CreateLinkModal from '../components/CreateLinkModal';
import debounce from 'lodash.debounce';

export default function Dashboard() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<LinkType>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLinks = async (p: number, s: string) => {
    setLoading(true);
    try {
      const result = await api.getLinks(p, 10, s);
      setLinks(result.data);
      setMeta(result.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setPage(1);
      fetchLinks(1, query);
    }, 500),
    []
  );

  useEffect(() => {
    fetchLinks(page, search);
  }, [page]); // Removed search from deps as it's handled by debouncedSearch

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const getStatusBadge = (link: LinkType) => {
    if (link.disabled) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Disabled</span>;
    }
    if (link.clickCap && link.clickCount >= link.clickCap) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Capped</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search links..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Create Link
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
              <th className="p-4">Short URL</th>
              <th className="p-4">Destination</th>
              <th className="p-4 text-right">Clicks</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && links.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">Loading links...</td>
              </tr>
            ) : links.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">No links found. Create one!</td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 font-medium text-primary">/{link.slug}</td>
                  <td className="p-4 text-slate-600 max-w-xs truncate" title={link.destinationUrl}>
                    {link.destinationUrl}
                  </td>
                  <td className="p-4 text-right text-slate-600">
                    {link.clickCount} <span className="text-slate-400 text-xs">{link.clickCap ? `/ ${link.clickCap}` : ''}</span>
                  </td>
                  <td className="p-4">{getStatusBadge(link)}</td>
                  <td className="p-4 text-slate-500 text-sm">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      to={`/links/${link.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <BarChart2 size={16} />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
          <div>
            Showing page {meta.page} of {meta.totalPages} ({meta.totalItems} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      <CreateLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          setPage(1);
          fetchLinks(1, search);
        }}
      />
    </div>
  );
}
