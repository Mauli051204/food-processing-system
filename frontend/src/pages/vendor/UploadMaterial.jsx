import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { uploadMaterialFile } from '../../services/vendorApi';

function UploadMaterial() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setResult(null);
    try {
      const res = await uploadMaterialFile(formData);
      setResult(res.data.summary);
      toast.success(res.data.message);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Upload Material</h2>

      <form onSubmit={handleSubmit} className="card mb-4" style={{ maxWidth: '500px' }}>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">CSV or XLSX file</label>
            <input
              type="file"
              className="form-control"
              accept=".csv,.xlsx"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      {result && (
        <div className="card" style={{ maxWidth: '500px' }}>
          <div className="card-body">
            <h5 className="card-title">Upload Summary</h5>
            <p>File: {result.file_name}</p>
            <p>Rows uploaded: {result.uploaded_rows}</p>
            <p className="text-success">Imported: {result.imported_rows}</p>
            <p className="text-danger">Rejected: {result.rejected_rows}</p>
            {result.rejected_details && result.rejected_details.length > 0 && (
              <details>
                <summary>Rejection details</summary>
                <ul className="small">
                  {result.rejected_details.map((r, i) => (
                    <li key={i}>Row {r.row_number}: {r.errors.join(', ')}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadMaterial;