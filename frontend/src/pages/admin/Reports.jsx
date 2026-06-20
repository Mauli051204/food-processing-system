import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { downloadReport } from '../../services/adminApi';

const REPORT_TYPES = [
  { value: 'users', label: 'Users' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'materials', label: 'Materials' },
  { value: 'encryption', label: 'Encryption' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'audit', label: 'Audit' },
];

const FORMATS = [
  { value: 'csv', label: 'CSV', ext: 'csv' },
  { value: 'excel', label: 'Excel', ext: 'xlsx' },
  { value: 'pdf', label: 'PDF', ext: 'pdf' },
];

function Reports() {
  const [reportType, setReportType] = useState('users');
  const [loadingFormat, setLoadingFormat] = useState(null);

  const handleExport = async (formatObj) => {
    setLoadingFormat(formatObj.value);
    try {
      const res = await downloadReport(reportType, formatObj.value);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.${formatObj.ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${formatObj.label} report downloaded.`);
    } catch (err) {
      toast.error('Failed to generate report.');
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Reports</h2>

      <div className="card" style={{ maxWidth: '500px' }}>
        <div className="card-body">
          <label className="form-label">Report Type</label>
          <select className="form-select mb-3" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <label className="form-label">Export Format</label>
          <div className="d-flex gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                className="btn btn-outline-primary"
                disabled={loadingFormat === f.value}
                onClick={() => handleExport(f)}
              >
                {loadingFormat === f.value ? 'Generating...' : f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;