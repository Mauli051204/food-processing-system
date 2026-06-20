import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUsers, approveUser, rejectUser, activateUser, deactivateUser } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import Loader from '../../components/admin/Loader';
import RejectReasonModal from '../../components/admin/RejectReasonModal';
import { usePagination } from '../../hooks/usePagination';

function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { page, setPage, pagination, setPagination } = usePagination();

  const fetchUsers = () => {
    setLoading(true);
    getUsers({ search, role: roleFilter, status: statusFilter, page })
      .then((res) => {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveUser(id);
      toast.success('User approved.');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve user.');
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
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await activateUser(id);
      toast.success('User activated.');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to activate user.');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateUser(id);
      toast.success('User deactivated.');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to deactivate user.');
    }
  };

  return (
    <div>
      <h2 className="mb-4">Users</h2>

      <div className="d-flex gap-3 mb-3 flex-wrap">
        <SearchBar onSearch={(val) => { setSearch(val); setPage(1); fetchUsers(); }} placeholder="Search by name or email" />
        <select className="form-select w-auto" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="VENDOR">Vendor</option>
          <option value="PURCHASE">Purchase</option>
          <option value="TECH">Tech</option>
          <option value="PRODUCTION">Production</option>
        </select>
        <select className="form-select w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <DataTable
            columns={['Name', 'Email', 'Role', 'Approved', 'Active', 'Joined', 'Actions']}
            data={users}
            emptyMessage="No users found."
            renderRow={(u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge bg-secondary">{u.role}</span></td>
                <td>{u.is_approved ? <span className="badge bg-success">Yes</span> : <span className="badge bg-warning">No</span>}</td>
                <td>{u.is_active ? <span className="badge bg-success">Active</span> : <span className="badge bg-danger">Inactive</span>}</td>
                <td className="text-muted small">{new Date(u.date_joined).toLocaleDateString()}</td>
                <td>
                  <div className="d-flex gap-1 flex-wrap">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/admin/users/${u.id}`)}>View</button>
                    {!u.is_approved && (
                      <>
                        <button className="btn btn-sm btn-success" disabled={actionLoading} onClick={() => handleApprove(u.id)}>Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setRejectTarget(u.id)}>Reject</button>
                      </>
                    )}
                    {u.is_approved && u.is_active && (
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDeactivate(u.id)}>Deactivate</button>
                    )}
                    {u.is_approved && !u.is_active && (
                      <button className="btn btn-sm btn-outline-success" onClick={() => handleActivate(u.id)}>Activate</button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          />
          <Pagination pagination={pagination} page={page} setPage={setPage} />
        </>
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

export default Users;