import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getVendorProfile, updateVendorProfile } from '../../services/vendorApi';
import Loader from '../../components/admin/Loader';

function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getVendorProfile()
      .then((res) => setProfile(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Only company_name and address are actually editable —
      // phone and email live on the User model, not VendorProfile,
      // and are read-only here.
      const res = await updateVendorProfile({
        company_name: profile.company_name,
        address: profile.address,
      });
      setProfile(res.data);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (!profile) return null;

  return (
    <div>
      <h2 className="mb-4">Profile</h2>
      <form onSubmit={handleSave} className="card" style={{ maxWidth: '500px' }}>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input className="form-control" value={profile.full_name || ''} disabled />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" value={profile.email || ''} disabled />
          </div>
          <div className="mb-3">
            <label className="form-label">Phone</label>
            <input className="form-control" value={profile.phone || ''} disabled />
            <small className="text-muted">Contact an administrator to change your phone number.</small>
          </div>
          <div className="mb-3">
            <label className="form-label">Company Name</label>
            <input className="form-control" value={profile.company_name || ''} onChange={(e) => handleChange('company_name', e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Address</label>
            <input className="form-control" value={profile.address || ''} onChange={(e) => handleChange('address', e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VendorProfile;