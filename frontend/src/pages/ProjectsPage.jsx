import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ResourcePage from './ResourcePage';
import { Panel } from '../components/AppShell';
import { Modal, FormField, TextInput, TextArea, SubmitButton } from '../components/Forms';
import api from '../api/client';

export default function ProjectsPage() {
  const { currentOrganizationId: organizationId } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ name: '', key: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetForm = () => { setForm({ name: '', key: '', description: '' }); setError(null); };

  const openCreate = () => { resetForm(); setShowCreate(true); };
  const openEdit = (project) => {
    setForm({ name: project.name, key: project.key, description: project.description || '' });
    setEditingProject(project);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, {
          name: form.name, key: form.key, description: form.description || undefined
        });
      } else {
        await api.post('/projects', {
          organizationId, name: form.name, key: form.key, description: form.description || undefined
        });
      }
      setShowCreate(false);
      setEditingProject(null);
      resetForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${project.id}`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message);
    }
  };

  const actions = [
    { label: 'Edit', onClick: openEdit },
    { label: 'Delete', tone: 'danger', onClick: handleDelete }
  ];

  if (!organizationId) {
    return (
      <Panel>
        <div className="text-sm text-slate-300">No organization selected. Register or join an organization to view projects.</div>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Projects</h2>
          <p className="mt-1 text-sm text-slate-300">Organized workspaces that group queues and jobs.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          + New Project
        </button>
      </div>

      <ResourcePage
        key={refreshKey}
        title="Projects"
        description=""
        endpoint={`/projects?organizationId=${organizationId}`}
        actions={actions}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'key', label: 'Key' },
          { key: 'description', label: 'Description' },
          { key: 'createdAt', label: 'Created', render: (row) => new Date(row.createdAt).toLocaleString() }
        ]}
      />

      <Modal open={showCreate || !!editingProject} onClose={() => { setShowCreate(false); setEditingProject(null); }} title={editingProject ? 'Edit Project' : 'Create Project'}>
        {error && <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Project" required />
          </FormField>
          <FormField label="Key" required>
            <TextInput value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="my_project" required />
          </FormField>
          <FormField label="Description">
            <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </FormField>
          <SubmitButton loading={loading}>{editingProject ? 'Save Changes' : 'Create Project'}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
