import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'chart.js/auto';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../api/client';
import { createSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import { Panel, PageHeader, StatCard, Table } from '../components/AppShell';

function buildSeries(recentJobs) {
  const counts = new Map();
  recentJobs.forEach((job) => {
    const date = new Date(job.createdAt);
    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const entries = Array.from(counts.entries()).sort(([left], [right]) => Number(left) - Number(right));

  return {
    labels: entries.map(([timestamp]) => new Date(Number(timestamp)).toLocaleDateString()),
    values: entries.map(([, value]) => value)
  };
}

export default function DashboardPage() {
  const { currentOrganizationId: organizationId } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!organizationId) return undefined;

    mountedRef.current = true;

    const load = async () => {
      try {
        const response = await api.get(`/dashboard/metrics?organizationId=${organizationId}`);
        if (mountedRef.current) {
          setMetrics(response.data.data);
          setError(null);
        }
      } catch (requestError) {
        if (mountedRef.current) {
          setError(requestError.response?.data?.error?.message || requestError.message);
        }
      }
    };

    const debouncedLoad = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (mountedRef.current) load();
      }, 1000);
    };

    const socket = createSocket();
    socket.on('job.completed', debouncedLoad);
    socket.on('job.failed', debouncedLoad);
    socket.on('queue.updated', debouncedLoad);
    socket.on('job.created', debouncedLoad);

    load();

    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      socket.off('job.completed', debouncedLoad);
      socket.off('job.failed', debouncedLoad);
      socket.off('queue.updated', debouncedLoad);
      socket.off('job.created', debouncedLoad);
      socket.disconnect();
    };
  }, [organizationId]);

  const series = useMemo(() => buildSeries(metrics?.recentJobs || []), [metrics]);

  if (!organizationId) {
    return (
      <div className="space-y-5">
        <PageHeader title="Dashboard" description="Create or join an organization to start tracking queue and worker health." />
        <Panel>
          <div className="text-sm text-slate-300">No organization is associated with the current account.</div>
        </Panel>
      </div>
    );
  }

  const stats = metrics?.jobCounts || {};
  const queueHealth = metrics?.queueHealth || {};
  const workers = metrics?.workerStatus || {};

  const lineData = {
    labels: series.labels,
    datasets: [{
      label: 'Jobs created',
      data: series.values,
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34, 211, 238, 0.18)',
      tension: 0.35,
      fill: true
    }]
  };

  const doughnutData = {
    labels: ['Queued', 'Scheduled', 'Running', 'Completed', 'Failed'],
    datasets: [{
      data: [stats.queued || 0, stats.scheduled || 0, stats.running || 0, stats.completed || 0, stats.failed || 0],
      backgroundColor: ['#22d3ee', '#f97316', '#34d399', '#93c5fd', '#fb7185'],
      borderWidth: 0
    }]
  };

  const workerData = {
    labels: ['Online', 'Draining', 'Offline'],
    datasets: [{
      label: 'Workers',
      data: [workers.online || 0, workers.draining || 0, workers.offline || 0],
      backgroundColor: ['#34d399', '#f97316', '#fb7185']
    }]
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" description="Queue health, worker status, running jobs, completed jobs, and retry pressure at a glance." />

      {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Queues" value={queueHealth.active || 0} hint="Available for polling" tone="cyan" />
        <StatCard label="Running Jobs" value={stats.running || 0} hint="Currently executing" tone="amber" />
        <StatCard label="Completed Jobs" value={stats.completed || 0} hint="Successfully finished" tone="emerald" />
        <StatCard label="Failed Jobs" value={(stats.failed || 0) + (stats.deadLetter || 0)} hint="Failed or dead-lettered" tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <div className="mb-4">
            <div className="text-sm font-semibold text-white">Throughput trend</div>
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Recent job creation</div>
          </div>
          <div className="h-[320px]">
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </Panel>

        <Panel>
          <div className="mb-4">
            <div className="text-sm font-semibold text-white">Job lifecycle</div>
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Operational distribution</div>
          </div>
          <div className="h-[320px]">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel>
          <div className="mb-4">
            <div className="text-sm font-semibold text-white">Worker fleet</div>
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Node health</div>
          </div>
          <div className="h-[280px]">
            <Bar data={workerData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </Panel>

        <Panel className="xl:col-span-2">
          <div className="mb-4">
            <div className="text-sm font-semibold text-white">System metrics</div>
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Queue and execution summary</div>
          </div>
          <Table
            columns={[
              { key: 'metric', label: 'Metric' },
              { key: 'value', label: 'Value' }
            ]}
            rows={[
              { id: 'queued', metric: 'Queued', value: stats.queued || 0 },
              { id: 'scheduled', metric: 'Scheduled', value: stats.scheduled || 0 },
              { id: 'claimed', metric: 'Claimed', value: stats.claimed || 0 },
              { id: 'retry', metric: 'Retry count', value: stats.scheduled || 0 },
              { id: 'workers', metric: 'Online workers', value: workers.online || 0 },
              { id: 'paused', metric: 'Paused queues', value: queueHealth.paused || 0 }
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
