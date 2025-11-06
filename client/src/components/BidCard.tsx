import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TruckIcon, CalendarIcon, StarIcon } from "lucide-react";
import RecommendedBadge from "./RecommendedBadge";

interface BidCardProps {
  id: string;
  carrierName: string;
  rwsScore: number;
  bidAmount: number;
  deliveryTime: string;
  vehicleType: string;
  completedDeliveries: number;
  isRecommended?: boolean;
}

export default function BidCard({
  id,
  carrierName,
  rwsScore,
  bidAmount,
  deliveryTime,
  vehicleType,
  completedDeliveries,
  isRecommended = false
}: BidCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-bid-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(carrierName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{carrierName}</h3>
              <RecommendedBadge 
                isRecommended={isRecommended} 
                size="sm" 
                showTooltip={false} 
                testId={`badge-recommended-bid-${id}`}
              />
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <StarIcon className="w-3 h-3 fill-accent text-accent" />
              <span className="font-mono font-semibold">RWS {rwsScore}</span>
              <span className="mx-1">•</span>
              <span>{completedDeliveries} доставок</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Предложение</div>
            <div className="text-xl font-bold font-mono">{bidAmount.toLocaleString()} ₸</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Срок доставки</div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span className="font-mono">{deliveryTime}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t">
          <TruckIcon className="w-4 h-4 text-muted-foreground" />
          <Badge variant="outline">{vehicleType}</Badge>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1" data-testid={`button-view-${id}`}>
          Просмотр
        </Button>
        <Button className="flex-1" data-testid={`button-accept-${id}`}>
          Принять
        </Button>
      </CardFooter>
    </Card>
  );
}