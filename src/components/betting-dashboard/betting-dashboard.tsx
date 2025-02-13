// Updated dashboard component that matches the template structure
'use client';

import { FileUpload } from '../upload/file-upload';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardShell } from '@/components/dashboard/shell';

export function BettingDashboard() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Betting Dashboard"
        text="Upload and analyze your betting history."
      />
      <div className="grid gap-8">
        <FileUpload />
      </div>
    </DashboardShell>
  );
}