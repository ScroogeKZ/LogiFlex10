import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RWSScoreProps {
  score: number;
  onTimeDelivery: number;
  cargoCondition: number;
  communication: number;
  documentation: number;
}

export default function RWSScore({
  score,
  onTimeDelivery,
  cargoCondition,
  communication,
  documentation
}: RWSScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-accent-foreground";
    if (score >= 70) return "text-primary";
    return "text-destructive";
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-accent";
    if (value >= 70) return "bg-primary";
    return "bg-destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Оценка качества RWS</span>
          <span className={`text-4xl font-bold font-mono ${getScoreColor(score)}`}>
            {score}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Своевременная доставка</span>
            <span className="font-mono font-semibold">{onTimeDelivery}%</span>
          </div>
          <Progress value={onTimeDelivery} className={getProgressColor(onTimeDelivery)} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Сохранность груза</span>
            <span className="font-mono font-semibold">{cargoCondition}%</span>
          </div>
          <Progress value={cargoCondition} className={getProgressColor(cargoCondition)} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Коммуникация</span>
            <span className="font-mono font-semibold">{communication}%</span>
          </div>
          <Progress value={communication} className={getProgressColor(communication)} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Документооборот</span>
            <span className="font-mono font-semibold">{documentation}%</span>
          </div>
          <Progress value={documentation} className={getProgressColor(documentation)} />
        </div>
      </CardContent>
    </Card>
  );
}