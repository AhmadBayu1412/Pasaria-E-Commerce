'use client';

interface ActivityItem {
  id: string;
  type: 'order' | 'product' | 'user' | 'payment';
  action: string;
  actor: { id: number; name: string };
  target?: { id: number; name: string; type?: string };
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  limit?: number;
  onItemClick?: (item: ActivityItem) => void;
}

export function ActivityFeed({ activities, limit = 10, onItemClick }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, limit);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'order':
        return '🛒';
      case 'product':
        return '📦';
      case 'user':
        return '👤';
      case 'payment':
        return '💳';
      default:
        return '•';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      {displayActivities.length === 0 ? (
        <p className="text-secondary-500 text-sm">Belum ada aktivitas</p>
      ) : (
        displayActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 hover:bg-secondary-50 rounded-lg cursor-pointer"
            onClick={() => onItemClick?.(activity)}
          >
            <span className="text-lg">{getActivityIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-secondary-900">
                <span className="font-medium">{activity.actor.name}</span>
                {' '}
                {activity.action}
                {activity.target && (
                  <>
                    {' '}
                    <span className="font-medium">{activity.target.name}</span>
                  </>
                )}
              </p>
              <p className="text-xs text-secondary-500">
                {formatTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
