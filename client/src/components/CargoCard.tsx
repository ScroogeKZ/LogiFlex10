import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPinIcon, CalendarIcon, WeightIcon, DollarSignIcon, ArrowRightIcon } from "lucide-react";
import { Link } from "wouter";

interface CargoCardProps {
  id: string;
  title: string;
  origin: string;
  destination: string;
  weight: number;
  price: number;
  pickupDate: string;
  status: "active" | "in_progress" | "completed" | "cancelled";
  category: string;
}

export default function CargoCard({
  title,
  origin,
  destination,
  weight,
  price,
  pickupDate,
  status,
  category,
  id
}: CargoCardProps) {
  const statusColors = {
    active: "bg-accent text-accent-foreground",
    in_progress: "bg-primary/10 text-primary",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive"
  };
  
  const statusLabels = {
    active: "Активный",
    in_progress: "В процессе",
    completed: "Завершен",
    cancelled: "Отменен"
  };

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-cargo-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight">{title}</h3>
          <Badge className={statusColors[status]} data-testid={`badge-status-${id}`}>
            {statusLabels[status]}
          </Badge>
        </div>
        <Badge variant="outline" className="w-fit mt-2">{category}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPinIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium">{origin}</div>
            <div className="text-muted-foreground">→ {destination}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <WeightIcon className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono">{weight} т</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono">{pickupDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t">
          <DollarSignIcon className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold font-mono">{price.toLocaleString()}</span>
          <span className="text-muted-foreground">₸</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/cargo/${id}`} className="w-full">
          <Button className="w-full" data-testid={`button-view-cargo-${id}`} asChild>
            <a>
              Подробнее
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}