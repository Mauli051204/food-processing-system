import React, { useState } from 'react';
import { uploadMaterialFile } from '../../api/vendorApi';

function VendorUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSummary(null);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadMaterialFile(formData);
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4">Upload Material File</h2>

      <form onSubmit={handleUpload}>
        <div className="mb-3">
          <input
            type="file"
            className="form-control"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
          />
          <small className="text-muted">CSV or XLSX only. Max 10MB.</small>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {summary && (
        <div className="card mt-4">
          <div className="card-body">
            <h5>Upload Summary</h5>
            <p>File: {summary.file_name}</p>
            <p>Uploaded Rows: {summary.uploaded_rows}</p>
            <p className="text-success">Imported Rows: {summary.imported_rows}</p>
            <p className="text-danger">Rejected Rows: {summary.rejected_rows}</p>

            {summary.rejected_details.length > 0 && (
              <div>
                <h6>Rejected Row Details</h6>
                <ul>
                  {summary.rejected_details.map((detail) => (
                    <li key={detail.row_number}>
                      Row {detail.row_number}: {detail.errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorUpload;