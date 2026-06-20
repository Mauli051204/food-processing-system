import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { generateTxt, encryptBatch } from '../../services/techApi';

function ProcessBatch() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [txtResult, setTxtResult] = useState(null);
  const [encryptResult, setEncryptResult] = useState(null);
  const [loadingStep, setLoadingStep] = useState(null);

  const handleGenerateTxt = async () => {
    setLoadingStep('txt');
    try {
      const res = await generateTxt(batchId);
      setTxtResult(res.data.data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate TXT.');
    } finally {
      setLoadingStep(null);
    }
  };

  const handleEncrypt = async () => {
    setLoadingStep('encrypt');
    try {
      const res = await encryptBatch(batchId);
      setEncryptResult(res.data.data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to encrypt batch.');
    } finally {
      setLoadingStep(null);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <button className="btn btn-link ps-0 mb-3" onClick={() => navigate('/tech/received-materials')}>&larr; Back to Received Materials</button>
      <h2 className="mb-4">Process Batch: {batchId}</h2>

      <div className="card mb-3">
        <div className="card-body">
          <h5>Step 1: Generate TXT File</h5>
          <p className="text-muted small">Compiles all materials in this batch into a single TXT file.</p>
          <button className="btn btn-primary" onClick={handleGenerateTxt} disabled={loadingStep === 'txt' || txtResult}>
            {loadingStep === 'txt' ? 'Generating...' : txtResult ? 'TXT Generated ✓' : 'Generate TXT'}
          </button>
          {txtResult && (
            <div className="alert alert-success mt-2 mb-0">
              {txtResult.material_count} material(s) written to {txtResult.txt_path}
            </div>
          )}
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h5>Step 2: Encrypt File</h5>
          <p className="text-muted small">AES-256 encrypts the TXT file and generates a wrapped encryption key for Admin approval.</p>
          <button className="btn btn-warning" onClick={handleEncrypt} disabled={loadingStep === 'encrypt' || !txtResult || encryptResult}>
            {loadingStep === 'encrypt' ? 'Encrypting...' : encryptResult ? 'Encrypted ✓' : 'Encrypt File'}
          </button>
          {encryptResult && (
            <div className="alert alert-success mt-2 mb-0">
              Batch encrypted successfully. Admin has been notified for key approval.
            </div>
          )}
        </div>
      </div>

      {encryptResult && (
        <button className="btn btn-secondary" onClick={() => navigate('/tech/received-materials')}>
          Done — Back to Received Materials
        </button>
      )}
    </div>
  );
}

export default ProcessBatch;