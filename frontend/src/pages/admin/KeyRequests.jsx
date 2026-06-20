import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getKeyRequests, approveKeyRequest, rejectKeyRequest } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import Loader from '../../components/admin/Loader';
import RejectReasonModal from '../../components/admin/RejectReasonModal';

function KeyRequests() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    getKeyRequests({ status: statusFilter })
      .then((res) => setRequests(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveKeyRequest(id);
      toast.success('Key request approved.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    setActionLoading(true);
    try {
      await rejectKeyRequest(rejectTarget, reason);
      toast.success('Key request rejected.');
      setRejectTarget(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Key Requests</h2>

      <select className="form-select w-auto mb-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">All</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>

      {loading ? (
        <Loader />
      ) : (
        <DataTable
          columns={['Material', 'Vendor', 'Requested By', 'Status', 'Requested', 'Approved', 'Actions']}
          data={requests}
          emptyMessage="No key requests found."
          renderRow={(r) => (
            <tr key={r.id}>
              <td>{r.material_name}</td>
              <td>{r.vendor_name}</td>
              <td>{r.requested_by_name}</td>
              <td><span className={`badge bg-${r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}`}>{r.status}</span></td>
              <td className="text-muted small">{new Date(r.requested_at).toLocaleString()}</td>
              <td className="text-muted small">{r.approved_at ? new Date(r.approved_at).toLocaleString() : '-'}</td>
              <td>
                {r.status === 'PENDING' && (
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-success" disabled={actionLoading} onClick={() => handleApprove(r.id)}>Approve</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setRejectTarget(r.id)}>Reject</button>
                  </div>
                )}
              </td>
            </tr>
          )}
        />
      )}

      <RejectReasonModal
        show={!!rejectTarget}
        title="Reject Key Request"
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
        loading={actionLoading}
      />
    </div>
  );
}

export default KeyRequests;