'use client';

import { useState } from 'react';

export default function DebugPanel({ errors = [], tasks = [], projects = [] }) {
  const [show, setShow] = useState(false);
  
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-20 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs z-50"
      >
        Debug ({errors.length})
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-auto">
      <div className="bg-white m-4 p-4 rounded-lg max-h-screen overflow-auto">
        <button
          onClick={() => setShow(false)}
          className="float-right text-gray-500"
        >
          Close X
        </button>
        
        <h3 className="font-bold mb-2">Debug Info</h3>
        
        <div className="mb-4">
          <h4 className="font-semibold">Errors ({errors.length}):</h4>
          <div className="text-xs bg-red-50 p-2 rounded max-h-40 overflow-auto">
            {errors.length === 0 ? 'No errors' : errors.map((e, i) => (
              <div key={i} className="mb-2">
                {e.message || e.toString()}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold">Tasks ({tasks.length}):</h4>
          <div className="text-xs bg-gray-50 p-2 rounded max-h-40 overflow-auto">
            {tasks.map((t, i) => (
              <div key={i} className="mb-1">
                {t.id}: {t.title} {t.isProject ? '(PROJECT)' : ''} 
                {t.subtasks ? ` [${t.subtasks.length} subtasks]` : ''}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold">Projects ({projects.length}):</h4>
          <div className="text-xs bg-blue-50 p-2 rounded max-h-40 overflow-auto">
            {projects.map((p, i) => (
              <div key={i} className="mb-1">
                {p.id}: {p.title} - {p.subtasks?.length || 0} subtasks
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>Total Tasks: {tasks.length}</p>
          <p>Total Projects: {projects.length}</p>
          <p>Has errors: {errors.length > 0 ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}