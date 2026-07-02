import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';
import { Modal, FormField, TextInput, TextArea, SubmitButton, useToast } from '../components/Forms';
import api from '../api/client';

export default function QueuesPage() {
  const { currentOrganizationId: organizationId } = useAuth();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingQueue, setEditingQueue] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', projectId: '', description: '', priority: '0', concurrencyLimit: '5' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetForm = () => { setForm({ name: '', slug: '', projectId: '', description: '', priority: '0', concurrencyLimit: '5' }); setError(null); };

  const openCreate = () => { resetForm(); setShowCreate(true); };
  const openEdit = (queue) => {
    setForm({
      name: queue.name, slug: queue.slug, projectId: queue.projectId,
      description: queue.description || '', priority: String(queue.priority), concurrencyLimit: String(queue.concurrencyLimit)
    });
    setEditingQueue(queue);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        organizationId, projectId: form.projectId, name: form.name,
        slug: form.slug || undefined, description: form.description || undefined,
        priority: parseInt(form.priority, 10) || 0,
        concurrencyLimit: parseInt(form.concurrencyLimit, 10) || 5
      };
      if (editingQueue) {
        const { projectId, ...updateData } = payload;
        await api.put(`/queues/${editingQueue.id}`, updateData);
        toast.success('Queue updated');
      } else {
        await api.post('/queues', payload);
        toast.success('Queue created');
      }
      setShowCreate(false);
      setEditingQueue(null);
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

  const handleDelete = async (queue) => {
    if (!window.confirm(`Delete queue "${queue.name}"?`)) return;
    try {
      await api.delete(`/queues/${queue.id}`);
      toast.success('Queue deleted');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message);
    }
  };

  const handlePause = async (row) => {
    try {
      await api.post(`/queues/${row.id}/pause`, { reason: 'Paused from dashboard' });
      toast.success('Queue paused');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message);
    }
  };

  const handleResume = async (row) => {
    try {
      await api.post(`/queues/${row.id}/resume`);
      toast.success('Queue resumed');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.message);
    }
  };

  const actions = [
    { label: (row) => row.status === 'PAUSED' ? 'Resume' : 'Pause', onClick: (row) => row.status === 'PAUSED' ? handleResume(row) : handlePause(row) },
    { label: 'Edit', onClick: openEdit },
    { label: 'Delete', tone: 'danger', onClick: handleDelete }
  ];

  if (!organizationId) {
    return (
      <Panel>
        <div className="text-sm text-slate-300">No organization selected.</div>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Queues</h2>
          <p className="mt-1 text-sm text-slate-300">Priority, concurrency, retry policy, and queue capacity.</p>
        </div>
        <button onClick={openCreate} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          + New Queue
        </button>
      </div>

      <ResourcePage
        key={refreshKey}
        title="Queues"
        description=""
        endpoint={`/queues?organizationId=${organizationId}`}
        actions={actions}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug' },
          { key: 'status', label: 'Status', render: (row) => (
            <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
              {row.status}
            </span>
          )},
          { key: 'priority', label: 'Priority' },
          { key: 'concurrencyLimit', label: 'Concurrency' },
          { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() }
        ]}
      />

      <Modal open={showCreate || !!editingQueue} onClose={() => { setShowCreate(false); setEditingQueue(null); }} title={editingQueue ? 'Edit Queue' : 'Create Queue'}>
        {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="order-processing" required />
          </FormField>
          <FormField label="Slug">
            <TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generated from name" />
          </FormField>
          <FormField label="Project ID" required>
            <TextInput value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} placeholder="Enter project ID" required={!editingQueue} disabled={!!editingQueue} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Priority">
              <TextInput value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} type="number" />
            </FormField>
            <FormField label="Concurrency Limit">
              <TextInput value={form.concurrencyLimit} onChange={(e) => setForm({ ...form, concurrencyLimit: e.target.value })} type="number" />
            </FormField>
          </div>
          <FormField label="Description">
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <SubmitButton loading={loading}>{editingQueue ? 'Save Changes' : 'Create Queue'}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
