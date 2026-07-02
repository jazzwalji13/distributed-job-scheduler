import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';
import { Modal, FormField, TextInput, TextArea, SubmitButton, SelectInput, useToast } from '../components/Forms';
import api from '../api/client';

export default function JobsPage() {
  const { currentOrganizationId: organizationId } = useAuth();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState({
    projectId: '', queueId: '', type: 'IMMEDIATE', priority: '0',
    payload: '{}', runAt: '', maxAttempts: '3'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetForm = () => {
    setForm({ projectId: '', queueId: '', type: 'IMMEDIATE', priority: '0', payload: '{}', runAt: '', maxAttempts: '3' });
    setError(null);
  };

  const openCreate = () => { resetForm(); setShowCreate(true); };

  const openEdit = (job) => {
    setForm({
      projectId: job.projectId || '',
      queueId: job.queueId || '',
      type: job.type,
      priority: String(job.priority ?? 0),
      payload: JSON.stringify(job.payload || {}, null, 2),
      runAt: job.runAt ? new Date(job.runAt).toISOString().slice(0, 16) : '',
      maxAttempts: String(job.maxAttempts || 3)
    });
    setEditingJob(job);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let payload;
      try { payload = JSON.parse(form.payload); } catch { throw new Error('Invalid JSON payload'); }

      if (editingJob) {
        await api.put(`/jobs/${editingJob.id}`, {
          priority: parseInt(form.priority, 10) || 0,
          payload,
          maxAttempts: parseInt(form.maxAttempts, 10) || 3
        });
        toast.success('Job updated successfully');
      } else {
        const jobData = {
          organizationId, projectId: form.projectId, queueId: form.queueId,
          type: form.type, priority: parseInt(form.priority, 10) || 0,
          payload, maxAttempts: parseInt(form.maxAttempts, 10) || 3
        };
        if (form.runAt && form.type !== 'IMMEDIATE') {
          jobData.runAt = form.runAt;
        }
        await api.post('/jobs', jobData);
        toast.success('Job created successfully');
      }
      setShowCreate(false);
      setEditingJob(null);
      resetForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete job ${job.id.slice(0, 12)}...?`)) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      toast.success('Job deleted');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message);
    }
  };

  const handleRequeue = async (row) => {
    try {
      await api.post(`/jobs/${row.id}/requeue`);
      toast.success('Job requeued');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message);
    }
  };

  const actions = [
    { label: 'Edit', onClick: openEdit },
    { label: (row) => (row.status === 'FAILED' || row.status === 'DEAD_LETTER') ? 'Requeue' : null, onClick: handleRequeue },
    { label: 'Delete', tone: 'danger', onClick: handleDelete }
  ];

  const statusColor = (status) => {
    const map = {
      QUEUED: 'bg-cyan-500/15 text-cyan-300', SCHEDULED: 'bg-amber-500/15 text-amber-300',
      CLAIMED: 'bg-purple-500/15 text-purple-300', RUNNING: 'bg-blue-500/15 text-blue-300',
      COMPLETED: 'bg-emerald-500/15 text-emerald-300', FAILED: 'bg-rose-500/15 text-rose-300',
      DEAD_LETTER: 'bg-red-500/15 text-red-300'
    };
    return map[status] || 'bg-slate-500/15 text-slate-300';
  };

  if (!organizationId) {
    return <Panel><div className="text-sm text-slate-300">No organization selected.</div></Panel>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Jobs</h2>
          <p className="mt-1 text-sm text-slate-300">Immediate, delayed, scheduled, recurring, and batch job activity.</p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          + New Job
        </button>
      </div>

      <ResourcePage
        key={refreshKey}
        title="Jobs"
        description=""
        endpoint={`/jobs?organizationId=${organizationId}`}
        actions={actions}
        columns={[
          { key: 'id', label: 'Job ID', render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 12)}...</span> },
          { key: 'type', label: 'Type', render: (row) => <span className="rounded-lg bg-white/5 px-2 py-0.5 text-xs font-medium">{row.type}</span> },
          { key: 'status', label: 'Status', render: (row) => <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${statusColor(row.status)}`}>{row.status}</span> },
          { key: 'priority', label: 'Priority' },
          { key: 'attempts', label: 'Attempts' },
          { key: 'runAt', label: 'Run At', render: (row) => new Date(row.runAt).toLocaleString() }
        ]}
      />

      <Modal open={showCreate || !!editingJob} onClose={() => { setShowCreate(false); setEditingJob(null); }} title={editingJob ? 'Edit Job' : 'Create Job'}>
        {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingJob && (
            <>
              <FormField label="Project ID" required>
                <TextInput value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required />
              </FormField>
              <FormField label="Queue ID" required>
                <TextInput value={form.queueId} onChange={(e) => setForm({ ...form, queueId: e.target.value })} required />
              </FormField>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            {!editingJob && (
              <FormField label="Type" required>
                <SelectInput value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  options={['IMMEDIATE','DELAYED','SCHEDULED','RECURRING','BATCH'].map(t => ({ value: t, label: t }))} />
              </FormField>
            )}
            <FormField label="Priority">
              <TextInput value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} type="number" />
            </FormField>
          </div>
          <FormField label="Payload (JSON)" required>
            <TextArea value={form.payload} onChange={(e) => setForm({ ...form, payload: e.target.value })} rows={4} />
          </FormField>
          {!editingJob && (form.type === 'DELAYED' || form.type === 'SCHEDULED') && (
            <FormField label="Run At" required>
              <TextInput value={form.runAt} onChange={(e) => setForm({ ...form, runAt: e.target.value })} type="datetime-local" required />
            </FormField>
          )}
          <FormField label="Max Attempts">
            <TextInput value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })} type="number" />
          </FormField>
          <SubmitButton loading={loading}>{editingJob ? 'Save Changes' : 'Create Job'}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
