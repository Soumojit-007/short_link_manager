import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Link, LinkStats } from '../types';
import { ArrowLeft, ExternalLink, Ban, Trash2, Copy, Check } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function LinkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [link, setLink] = useState<Link | null>(null);
  const [stats, setStats] = useState<LinkStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.getLink(id),
        api.getLinkStats(id)
      ])
      .then(([linkData, statsData]) => {
        setLink(linkData);
        setStats(statsData.reverse()); // Ensure chronological order if returned reversed
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDisable = async () => {
    if (!id || !link) return;
    setActionLoading(true);
    try {
      const updated = await api.disableLink(id);
      setLink(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this link? All click data will be lost forever.')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.deleteLink(id);
      navigate('/links');
    } catch (err) {
      console.error(err);
      setActionLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!link) return;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const url = `${backendUrl}/r/${link.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading details...</div>;
  }

  if (!link) {
    return <div className="text-center py-12 text-red-500">Link not found</div>;
  }

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const shortUrl = `${backendUrl}/r/${link.slug}`;
  const isCapped = link.clickCap !== null && link.clickCount >= link.clickCap;

  return (
    <div className="space-y-6">
      <div>
        <RouterLink to="/links" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </RouterLink>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800 m-0">/{link.slug}</h2>
              {link.disabled ? (
                <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">Disabled</span>
              ) : isCapped ? (
                <span className="px-2.5 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Capped</span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Active</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-primary font-medium">
              <a href={shortUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1.5">
                {shortUrl} <ExternalLink size={16} />
              </a>
              <button 
                onClick={copyToClipboard}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </button>
            </div>

            <div className="text-slate-600">
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block mb-1">Destination</span>
              <a href={link.destinationUrl} target="_blank" rel="noreferrer" className="hover:underline break-all">
                {link.destinationUrl}
              </a>
            </div>
            
            <div className="flex gap-8 pt-4">
              <div>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block mb-1">Total Clicks</span>
                <span className="text-2xl font-bold text-slate-800">{link.clickCount}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block mb-1">Click Cap</span>
                <span className="text-2xl font-bold text-slate-800">{link.clickCap || '∞'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider block mb-1">Created</span>
                <span className="text-slate-800 font-medium">{new Date(link.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!link.disabled && (
              <button
                onClick={handleDisable}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 font-medium transition-colors disabled:opacity-50"
              >
                <Ban size={18} /> Disable
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">7-Day Click Activity (UTC)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getUTCMonth()+1}/${d.getUTCDate()}`;
                }}
              />
              <YAxis 
                allowDecimals={false} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelFormatter={(val) => `Date: ${val}`}
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="#aa3bff" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#aa3bff', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
