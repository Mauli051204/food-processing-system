import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getUsers, approveUser, rejectUser } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import Loader from '../../components/admin/Loader';
import RejectReasonModal from '../../components/admin/RejectReasonModal';

function PendingApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = () => {
    setLoading(true);
    getUsers({ status: 'pending' })
      .then((res) => setUsers(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveUser(id);
      toast.success('User approved.');
      fetchPending();
    } catch (err) {
      toast.error('Failed to approve user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    setActionLoading(true);
    try {
      await rejectUser(rejectTarget, reason);
      toast.success('User rejected.');
      setRejectTarget(null);
      fetchPending();
    } catch (err) {
      toast.error('Failed to reject user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Pending Approvals</h2>

      {loading ? (
        <Loader />
      ) : (
        <DataTable
          columns={['Name', 'Email', 'Role', 'Registered', 'Actions']}
          data={users}
          emptyMessage="No pending approvals."
          renderRow={(u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td><span className="badge bg-secondary">{u.role}</span></td>
              <td className="text-muted small">{new Date(u.date_joined).toLocaleDateString()}</td>
              <td>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-success" disabled={actionLoading} onClick={() => handleApprove(u.id)}>Approve</button>
                  <button className="btn btn-sm btn-danger" onClick={() => setRejectTarget(u.id)}>Reject</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <RejectReasonModal
        show={!!rejectTarget}
        title="Reject User"
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
        loading={actionLoading}
      />
    </div>
  );
}

export default PendingApprovals;