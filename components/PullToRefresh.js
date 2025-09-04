'use client';

// DEPRECATED: Pull-to-refresh has been disabled
// Component now renders children without swipe functionality
export default function PullToRefresh({ onRefresh, children }) {
  return (
    <div className="h-full overflow-auto">
      {children}
    </div>
  );
}