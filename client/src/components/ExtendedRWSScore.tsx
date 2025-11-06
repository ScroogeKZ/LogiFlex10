import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Award,
  Target,
  ThumbsUp
} from "lucide-react";
import RecommendedBadge from "./RecommendedBadge";

interface ExtendedRWSData {
  rwsScore: number;
  otdRate: number;
  acceptanceRate: number;
  reliabilityScore: number;
  totalTransactions: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  totalBids: number;
  acceptedBids: number;
  isRecommended: boolean;
}

interface ExtendedRWSScoreProps {
  data: ExtendedRWSData;
  variant?: "full" | "compact";
}

export default function ExtendedRWSScore({ data, variant = "full" }: ExtendedRWSScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-green-500/10 border-green-500/20";
    if (score >= 70) return "bg-yellow-500/10 border-yellow-500/20";
    if (score >= 50) return "bg-orange-500/10 border-orange-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getProgressColor = (value: number) => {
    if (value >= 85) return "bg-green-500";
    if (value >= 70) return "bg-yellow-500";
    if (value >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getScoreBgColor(data.rwsScore)}`}>
          <Award className={`w-5 h-5 ${getScoreColor(data.rwsScore)}`} />
          <div>
            <div className={`text-2xl font-bold font-mono ${getScoreColor(data.rwsScore)}`}>
              {data.rwsScore}
            </div>
            <div className="text-xs text-muted-foreground">RWS Score</div>
          </div>
        </div>
        {data.isRecommended && (
          <RecommendedBadge 
            isRecommended={true} 
            size="md" 
            testId="badge-recommended-extended-compact"
          />
        )}
      </div>
    );
  }

  return (
    <Card data-testid="card-extended-rws">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Репутационная Система RWS 2.0
            </CardTitle>
            <CardDescription>
              Расширенные метрики качества и надежности
            </CardDescription>
          </div>
          {data.isRecommended && (
            <RecommendedBadge 
              isRecommended={true} 
              size="lg" 
              testId="badge-recommended-extended-full"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`p-6 rounded-lg border ${getScoreBgColor(data.rwsScore)} text-center`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <TrendingUp className={`w-8 h-8 ${getScoreColor(data.rwsScore)}`} />
            <div className={`text-5xl font-bold font-mono ${getScoreColor(data.rwsScore)}`}>
              {data.rwsScore}
            </div>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Общий RWS Score
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            на основе {data.totalTransactions} транзакций
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-lg bg-card border" data-testid="metric-otd">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">On-Time Delivery</span>
              </div>
              <span className={`text-lg font-bold font-mono ${getScoreColor(data.otdRate)}`}>
                {data.otdRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={data.otdRate} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Вовремя: {data.onTimeDeliveries}</span>
              <span>Опозданий: {data.lateDeliveries}</span>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-card border" data-testid="metric-acceptance">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm">Acceptance Rate</span>
              </div>
              <span className={`text-lg font-bold font-mono ${getScoreColor(data.acceptanceRate)}`}>
                {data.acceptanceRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={data.acceptanceRate} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Принято: {data.acceptedBids}</span>
              <span>Всего ставок: {data.totalBids}</span>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-card border" data-testid="metric-reliability">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-sm">Reliability Score</span>
              </div>
              <span className={`text-lg font-bold font-mono ${getScoreColor(data.reliabilityScore)}`}>
                {data.reliabilityScore.toFixed(1)}
              </span>
            </div>
            <Progress 
              value={data.reliabilityScore} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              Комплексный показатель надежности
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-card border" data-testid="metric-transactions">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-sm">Total Activity</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold font-mono text-primary">
                  {data.totalTransactions}
                </div>
                <div className="text-xs text-muted-foreground">Транзакций</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-primary">
                  {data.totalBids}
                </div>
                <div className="text-xs text-muted-foreground">Ставок</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Критерии для статуса "Рекомендован"
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Минимум транзакций</span>
              <Badge variant={data.totalTransactions >= 5 ? "default" : "secondary"}>
                {data.totalTransactions >= 5 ? "✓" : "✗"} {data.totalTransactions}/5
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">OTD Rate</span>
              <Badge variant={data.otdRate >= 85 ? "default" : "secondary"}>
                {data.otdRate >= 85 ? "✓" : "✗"} {data.otdRate.toFixed(1)}%/85%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Acceptance Rate</span>
              <Badge variant={data.acceptanceRate >= 70 ? "default" : "secondary"}>
                {data.acceptanceRate >= 70 ? "✓" : "✗"} {data.acceptanceRate.toFixed(1)}%/70%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
