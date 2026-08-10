import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { api } from '../api';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateLinkModal({ isOpen, onClose, onCreated }: CreateLinkModalProps) {
  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [clickCap, setClickCap] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.createLink({
        destinationUrl: url,
        slug: slug.trim() || undefined,
        clickCap: clickCap ? parseInt(clickCap) : undefined,
      });
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      setCreatedUrl(`${backendUrl}/r/${result.slug}`);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setUrl('');
    setSlug('');
    setClickCap('');
    setError('');
    setCreatedUrl('');
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Create Short Link</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {createdUrl ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200">
                <p className="font-medium mb-2">Link Created Successfully!</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={createdUrl} 
                    className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm focus:outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex-shrink-0"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/very/long/path"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Slug (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. summer-sale"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Click Cap (Optional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={clickCap}
                  onChange={(e) => setClickCap(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
