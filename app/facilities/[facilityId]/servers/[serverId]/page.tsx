'use client';

import { useParams } from 'next/navigation';

export default function ServerDetailPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;
  const serverId = params.serverId as string;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Server Details</h1>
      <p>Facility: {facilityId}</p>
      <p>Server: {serverId}</p>
      <p className="text-muted-foreground mt-4">Server detail page coming soon...</p>
    </div>
  );
}
