import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="p-3">
      <ul className="pagination">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Previous</button>
        </li>
        {start > 1 && (
          <li className="page-item">
            <button className="page-link" onClick={() => onPageChange(1)}>1</button>
          </li>
        )}
        {pages.map(p => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
          </li>
        ))}
        {end < totalPages && (
          <li className="page-item">
            <button className="page-link" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          </li>
        )}
        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>Next</button>
        </li>
      </ul>
    </nav>
  );
}
