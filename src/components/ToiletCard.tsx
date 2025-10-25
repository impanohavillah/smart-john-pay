import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toilet } from '@/types/toilet';
import { MapPin, Edit, Trash2, DoorOpen, DoorClosed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToiletCardProps {
  toilet: Toilet;
  onEdit: (toilet: Toilet) => void;
  onDelete: (id: string) => void;
}

const ToiletCard = ({ toilet, onEdit, onDelete }: ToiletCardProps) => {
  const statusConfig = {
    available: {
      label: 'Available',
      className: 'bg-success text-success-foreground',
      animation: '',
    },
    occupied: {
      label: 'Occupied',
      className: 'bg-destructive text-destructive-foreground',
      animation: 'animate-status-pulse',
    },
    maintenance: {
      label: 'Maintenance',
      className: 'bg-warning text-warning-foreground',
      animation: '',
    },
  };

  const config = statusConfig[toilet.status];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in">
      <CardHeader className={cn('pb-3', config.className, config.animation)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{toilet.name}</CardTitle>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{toilet.location}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            {toilet.doorOpen ? (
              <DoorOpen className="w-4 h-4 text-success" />
            ) : (
              <DoorClosed className="w-4 h-4 text-muted-foreground" />
            )}
            <span>{toilet.doorOpen ? 'Door Open' : 'Door Closed'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Perfume: </span>
            <span className={toilet.settings.perfumeEnabled ? 'text-success' : 'text-muted-foreground'}>
              {toilet.settings.perfumeEnabled ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        {toilet.lastFlushed && (
          <div className="text-xs text-muted-foreground">
            Last flushed: {new Date(toilet.lastFlushed).toLocaleString()}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(toilet)} className="flex-1">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(toilet.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToiletCard;
