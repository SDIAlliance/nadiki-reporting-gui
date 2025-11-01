'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const facilityId = params.facilityId as string;
  const serverId = params.serverId as string;

  const baseUrl = `/facilities/${facilityId}/servers/${serverId}`;
  const isOperational = pathname === `${baseUrl}/operational`;
  const isEdit = pathname === `${baseUrl}/edit`;

  // Don't show tabs on edit page
  if (isEdit) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={isOperational ? 'operational' : 'overview'} className="w-full">
        <TabsList>
          <Link href={baseUrl} passHref legacyBehavior>
            <TabsTrigger value="overview" asChild>
              <a>Overview</a>
            </TabsTrigger>
          </Link>
          <Link href={`${baseUrl}/operational`} passHref legacyBehavior>
            <TabsTrigger value="operational" asChild>
              <a>Operational</a>
            </TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}
