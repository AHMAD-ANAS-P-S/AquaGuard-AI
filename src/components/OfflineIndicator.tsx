import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const OfflineIndicator = () => {
  const { isOnline, pendingCount, isSyncing, syncQueue } = useOfflineSync();

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isOnline ? 'default' : 'destructive'}
            className="gap-1 cursor-help"
          >
            {isOnline ? (
              <Cloud className="w-3 h-3" />
            ) : (
              <CloudOff className="w-3 h-3" />
            )}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline 
            ? 'Connected to server' 
            : 'Working offline - data will sync when connected'}
        </TooltipContent>
      </Tooltip>

      {pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 h-6 px-2"
              onClick={() => syncQueue()}
              disabled={!isOnline || isSyncing}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {pendingCount} pending
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSyncing 
              ? 'Syncing...' 
              : isOnline 
                ? 'Click to sync now' 
                : 'Will sync when online'}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
