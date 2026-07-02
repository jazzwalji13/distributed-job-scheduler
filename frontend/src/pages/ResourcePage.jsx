import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { PageHeader, Panel, Table } from '../components/AppShell';

const defaultTransform = (value) => value;

export default function ResourcePage({
  title,
  description,
  endpoint,
  columns,
  transform = defaultTransform,
  actions = []
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const loadRows = useCallback(() => {
    setError(null);

    api
      .get(endpoint)
      .then((response) => {
        if (!isMountedRef.current) {
          return;
        }

        const items = response.data.items || response.data.data?.items || [];
        setRows(transform(items));
        setError(null);
      })
      .catch((requestError) => {
        if (!isMountedRef.current) {
          return;
        }
        setError(requestError.response?.data?.error?.message || requestError.message);
      })
      .finally(() => {
        if (isMountedRef.current) {
          setLoading(false);
        }
      });
  }, [endpoint, transform]);

  useEffect(() => {
    isMountedRef.current = true;
    loadRows();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadRows]);

  const handleAction = async (action, row) => {
    try {
      setError(null);
      await action.onClick(row);
      await loadRows();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || requestError.message);
    }
  };

  const tableColumns = [
    ...columns,
    ...(actions.length
      ? [
          {
            key: '__actions__',
            label: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <button
                    key={typeof action.label === 'function' ? action.label(row) : action.label}
                    type="button"
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      action.tone === 'danger'
                        ? 'border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
                        : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20'
                    }`}
                    onClick={() => handleAction(action, row)}
                  >
                    {typeof action.label === 'function' ? action.label(row) : action.label}
                  </button>
                ))}
              </div>
            )
          }
        ]
      : [])
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />
      <Panel>
        {error ? <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
        {loading && rows.length === 0 ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : (
          <div>
            {loading ? <div className="mb-3 text-xs text-slate-500">Refreshing...</div> : null}
            <Table columns={tableColumns} rows={rows} emptyMessage={`No ${title.toLowerCase()} found`} />
          </div>
        )}
      </Panel>
    </div>
  );
}
