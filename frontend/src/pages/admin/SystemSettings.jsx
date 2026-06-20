import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getSystemSettings, updateSystemSettings } from '../../services/adminApi';
import Loader from '../../components/admin/Loader';

function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSystemSettings()
      .then((res) => setSettings(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateSystemSettings(settings);
      setSettings(res.data.data);
      toast.success('Settings updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (!settings) return null;

  return (
    <div>
      <h2 className="mb-4">System Settings</h2>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Application Name</label>
            <input className="form-control" value={settings.application_name} onChange={(e) => handleChange('application_name', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Company Name</label>
            <input className="form-control" value={settings.company_name} onChange={(e) => handleChange('company_name', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Maximum Upload Size (MB)</label>
            <input type="number" className="form-control" value={settings.max_upload_size_mb} onChange={(e) => handleChange('max_upload_size_mb', Number(e.target.value))} />
          </div>
          <div className="mb-3">
            <label className="form-label">Allowed File Types</label>
            <input className="form-control" value={settings.allowed_file_types} onChange={(e) => handleChange('allowed_file_types', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Session Timeout (minutes)</label>
            <input type="number" className="form-control" value={settings.session_timeout_minutes} onChange={(e) => handleChange('session_timeout_minutes', Number(e.target.value))} />
          </div>
          <div className="mb-3">
            <label className="form-label">Password Minimum Length</label>
            <input type="number" className="form-control" value={settings.password_min_length} onChange={(e) => handleChange('password_min_length', Number(e.target.value))} />
          </div>
          <div className="mb-3">
            <label className="form-label text-muted">AES Master Key</label>
            <input className="form-control" value="••••••••••••••••" disabled />
            <small className="text-muted">Never displayed or editable through the UI.</small>
          </div>

          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;