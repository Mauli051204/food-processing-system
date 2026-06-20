// C:\Mauli\GradTwin\Project\food-processing-system\frontend\src\components\admin\Loader.jsx
import React from 'react';

function Loader({ size = 'md' }) {
  const spinnerClass = size === 'sm' ? 'spinner-border-sm' : '';
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className={`spinner-border text-primary ${spinnerClass}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default Loader;