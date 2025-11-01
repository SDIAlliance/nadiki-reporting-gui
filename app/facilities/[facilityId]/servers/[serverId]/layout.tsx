'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServerResponse } from '@/packages/registrar-api-client/types/server-api';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ServerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const facilityId = params.facilityId as string;
  const serverId = params.serverId as string;

  const [open, setOpen] = useState(false);

  const baseUrl = `/facilities/${facilityId}/servers/${serverId}`;
  const isOperational = pathname === `${baseUrl}/operational`;
  const isImpact = pathname === `${baseUrl}/impact`;
  const isEdit = pathname === `${baseUrl}/edit`;

  // Fetch all servers for this facility
  const { data: serversData } = useSWR<{ items?: ServerResponse[] }>(
    `/api/servers?facility_id=${facilityId}`,
    fetcher
  );

  const servers = serversData?.items || [];
  const currentServer = servers.find(s => s.id === serverId);

  // Don't show tabs on edit page
  if (isEdit) {
    return <>{children}</>;
  }

  // Determine which tab is active
  let activeTab = 'overview';
  if (isOperational) activeTab = 'operational';
  if (isImpact) activeTab = 'impact';

  // Determine the current page type for navigation
  let currentPage = '';
  if (isOperational) currentPage = '/operational';
  if (isImpact) currentPage = '/impact';

  const handleServerChange = (newServerId: string) => {
    const newBaseUrl = `/facilities/${facilityId}/servers/${newServerId}`;
    router.push(newBaseUrl + currentPage);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Tabs value={activeTab} className="flex-1">
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
            <Link href={`${baseUrl}/impact`} passHref legacyBehavior>
              <TabsTrigger value="impact" asChild>
                <a>Impact</a>
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[500px] justify-between"
            >
              {currentServer?.id || 'Select server...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0">
            <Command>
              <CommandInput placeholder="Search servers..." />
              <CommandList>
                <CommandEmpty>No server found.</CommandEmpty>
                <CommandGroup>
                  {servers.map((server) => (
                    <CommandItem
                      key={server.id}
                      value={server.id}
                      onSelect={() => handleServerChange(server.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          serverId === server.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {server.id}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {children}
    </div>
  );
}
