import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserDetail } from '../../services/adminApi';
import Loader from '../../components/admin/Loader';
import ErrorState from '../../components/admin/ErrorState';

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getUserDetail(id)
      .then((res) => setUser(res.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (error || !user) return <ErrorState message="User not found." />;

  return (
    <div>
      <button className="btn btn-link mb-3 ps-0" onClick={() => navigate('/admin/users')}>&larr; Back to Users</button>
      <h2 className="mb-4">{user.name}</h2>
      <div className="card" style={{ maxWidth: '500px' }}>
        <div className="card-body">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone || '-'}</p>
          <p><strong>Role:</strong> <span className="badge bg-secondary">{user.role}</span></p>
          <p><strong>Approved:</strong> {user.is_approved ? 'Yes' : 'No'}</p>
          <p><strong>Active:</strong> {user.is_active ? 'Yes' : 'No'}</p>
          <p><strong>Registered:</strong> {new Date(user.date_joined).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default UserDetails;