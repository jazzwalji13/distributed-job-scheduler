import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { PageHeader, Panel, Table } from '../components/AppShell';

export default function ResourcePage({
  title,
  description,
  endpoint,
  columns,
  transform = (value) => value,
  actions = []
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRows = useCallback(() => {
    let mounted = true;
    setLoading(true);

    api
      .get(endpoint)
      .then((response) => {
        if (!mounted) {
          return;
        }

        const items = response.data.items || response.data.data?.items || [];
        setRows(transform(items));
      })
      .catch((requestError) => {
        if (!mounted) {
          return;
        }
        setError(requestError.response?.data?.error?.message || requestError.message);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [endpoint, transform]);

  useEffect(() => {
    const cleanup = loadRows();
    return cleanup;
  }, [loadRows]);

  const handleAction = async (action, row) => {
    await action.onClick(row);
    await loadRows();
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
        {loading ? <div className="text-sm text-slate-400">Loading...</div> : null}
        {error ? <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
        {!loading ? <Table columns={tableColumns} rows={rows} emptyMessage={`No ${title.toLowerCase()} found`} /> : null}
      </Panel>
    </div>
  );
}
