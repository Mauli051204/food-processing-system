import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateTxt, encryptBatch } from '../../api/techApi';

function GenerateTXT() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [txtResult, setTxtResult] = useState(null);
  const [encryptResult, setEncryptResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateTxt = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await generateTxt(batchId);
      setTxtResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate TXT.');
    } finally {
      setLoading(false);
    }
  };

  const handleEncrypt = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await encryptBatch(batchId);
      setEncryptResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to encrypt batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Process Batch: {batchId}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <h5>Step 1: Generate TXT File</h5>
          <button className="btn btn-primary" onClick={handleGenerateTxt} disabled={loading || txtResult}>
            {loading ? 'Processing...' : 'Generate TXT'}
          </button>
          {txtResult && (
            <div className="alert alert-success mt-2">
              TXT generated for {txtResult.material_count} material(s).
            </div>
          )}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5>Step 2: Encrypt File</h5>
          <button className="btn btn-warning" onClick={handleEncrypt} disabled={loading || !txtResult || encryptResult}>
            {loading ? 'Processing...' : 'Encrypt File'}
          </button>
          {encryptResult && (
            <div className="alert alert-success mt-2">
              Batch encrypted successfully. Admin has been notified for key approval.
            </div>
          )}
        </div>
      </div>

      {encryptResult && (
        <button className="btn btn-secondary" onClick={() => navigate('/tech/materials')}>
          Back to Received Materials
        </button>
      )}
    </div>
  );
}

export default GenerateTXT;