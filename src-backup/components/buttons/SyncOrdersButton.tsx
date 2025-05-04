'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { RefreshCcw } from 'lucide-react';

export function SyncOrdersButton({ accountId }: { accountId: string }) {
  const [loading, setLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [recentlySynced, setRecentlySynced] = useState(false);

  const fetchLastSync = async () => {
    const res = await fetch(`/api/last-sync?account_id=${accountId}`);
    const data = await res.json();
    if (data?.last_synced_at) {
      setLastSyncedAt(data.last_synced_at);
      const lastSync = new Date(data.last_synced_at).getTime();
      const now = new Date().getTime();
      const minutesAgo = (now - lastSync) / 1000 / 60;
      if (minutesAgo < 15) {
        setCooldown(Math.ceil((15 - minutesAgo) * 60));
      }
    }
  };

  const handleSync = async () => {
    if (cooldown > 0) return;

    setLoading(true);
    const toastId = toast.loading('Syncing orders...');

    try {
      const now = new Date();
      const toDate = now.toISOString().split('T')[0];
      const fromDate = lastSyncedAt
        ? new Date(lastSyncedAt).toISOString().split('T')[0]
        : new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0];

      const res = await fetch('/api/sync-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, fromDate, toDate })
      });

      const data = await res.json();
      console.log('📦 Sync result:', data);

      if (data.success) {
        if (data.imported === 0) {
          toast('No orders found', { id: toastId, icon: '📭' });
        } else {
          toast.success(`Imported ${data.imported} orders`, { id: toastId });
        }

        await fetchLastSync();
        setCooldown(60);
        setRecentlySynced(true);
        setTimeout(() => setRecentlySynced(false), 2000);
      } else {
        toast.error(`Sync failed: ${data.error}`, { id: toastId });
      }
    } catch (err) {
      console.error('❌ Unexpected error during sync:', err);
      toast.error('Unexpected error', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLastSync();
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={loading || cooldown > 0}
        className="flex items-center gap-1 border border-gray-300 text-sm text-gray-800 rounded px-3 py-1.5 bg-white hover:bg-gray-100 disabled:opacity-50 transition"
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
        {loading ? 'Syncing...' : recentlySynced ? 'Synced!' : 'Sync Orders'}
      </button>

      {cooldown > 0 ? (
        <span className="text-xs text-yellow-700 bg-yellow-100 rounded-full px-2 py-0.5">
          Wait {cooldown}s
        </span>
      ) : lastSyncedAt ? (
        <span className="text-xs text-gray-500">
          Last sync: {new Date(lastSyncedAt).toLocaleString()}
        </span>
      ) : null}
    </div>
  );
}