import { BadgeCheck, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecommendedBadgeProps {
  isRecommended: boolean;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  testId?: string;
}

export default function RecommendedBadge({ 
  isRecommended, 
  size = "md",
  showTooltip = true,
  testId = "badge-recommended"
}: RecommendedBadgeProps) {
  if (!isRecommended) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const badge = (
    <Badge 
      className={`bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 border-0 ${sizeClasses[size]} flex items-center gap-1.5 font-semibold shadow-md`}
      data-testid={testId}
    >
      <BadgeCheck className={iconSizes[size]} />
      Рекомендован
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
              <Info className="w-4 h-4" />
              Рекомендованный перевозчик
            </div>
            <p className="text-sm text-muted-foreground">
              Этот перевозчик получил статус "Рекомендован" за высокое качество работы:
            </p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-muted-foreground">
              <li>Минимум 5 завершенных транзакций</li>
              <li>85%+ доставок вовремя (OTD)</li>
              <li>70%+ принятых заявок</li>
              <li>Средний рейтинг 4.0+</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
