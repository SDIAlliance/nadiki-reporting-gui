'use client';

import { useParams } from 'next/navigation';

export default function NewServerPage() {
  const params = useParams();
  const facilityId = params.facilityId as string;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">New Server</h1>
      <p>Facility: {facilityId}</p>
      <p className="text-muted-foreground mt-4">Create new server page coming soon...</p>
    </div>
  );
}
