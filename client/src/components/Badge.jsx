import React from 'react';

export default function Badge({ status, children }) {
  return <span className={`badge badge-${status}`}>{children}</span>;
}
