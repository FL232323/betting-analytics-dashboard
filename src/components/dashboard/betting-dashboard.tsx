'use client';

import { FileUpload } from '../upload/file-upload';

export function BettingDashboard() {
  return (
    <div className="flex h-screen bg-gray-900">
      <div className="flex flex-col flex-1">
        <header className="px-6 py-4 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Current Role: USER — Change your role in settings.</p>
        </header>
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-6">
            <FileUpload />
          </div>
        </main>
      </div>
    </div>
  );
}