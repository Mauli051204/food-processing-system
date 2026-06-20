import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

function SearchBar({ placeholder = 'Search...', onSearch, initialValue = '' }) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex gap-2 mb-3" style={{ maxWidth: '400px' }}>
      <div className="input-group">
        <span className="input-group-text"><FiSearch /></span>
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-outline-primary">Search</button>
    </form>
  );
}

export default SearchBar;