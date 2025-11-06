import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, CheckCircle, Clock, Award } from "lucide-react";
import RecommendedBadge from "./RecommendedBadge";

interface RWSAdvancedMetricsProps {
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

export default function RWSAdvancedMetrics({
  rwsScore,
  otdRate,
  acceptanceRate,
  reliabilityScore,
  totalTransactions,
  onTimeDeliveries,
  lateDeliveries,
  totalBids,
  acceptedBids,
  isRecommended
}: RWSAdvancedMetricsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-green-600";
    if (value >= 70) return "bg-blue-600";
    if (value >= 50) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card className="w-full" data-testid="card-rws-advanced">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span>Расширенные метрики RWS 2.0</span>
          </div>
          <RecommendedBadge 
            isRecommended={isRecommended} 
            size="md" 
            showTooltip={true} 
            testId="badge-rws-advanced-recommended"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall RWS Score */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid="section-rws-advanced-overall">
          <div>
            <p className="text-sm text-muted-foreground">Общий балл RWS</p>
            <p className="text-xs text-muted-foreground mt-1">
              На основе {totalTransactions} завершенных сделок
            </p>
          </div>
          <div className={`text-5xl font-bold font-mono ${getScoreColor(rwsScore)}`} data-testid="text-rws-advanced-score">
            {rwsScore}
          </div>
        </div>

        {/* OTD Rate - On-Time Delivery */}
        <div className="space-y-2" data-testid="section-rws-advanced-otd">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">Своевременность доставки (OTD)</span>
            </div>
            <span className={`text-lg font-mono font-semibold ${getScoreColor(otdRate)}`} data-testid="text-rws-advanced-otd">
              {otdRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={otdRate} className={getProgressColor(otdRate)} />
          <p className="text-xs text-muted-foreground">
            Вовремя: {onTimeDeliveries} | Опоздания: {lateDeliveries}
          </p>
        </div>

        {/* Acceptance Rate */}
        <div className="space-y-2" data-testid="section-rws-advanced-acceptance">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">Процент принятых заявок</span>
            </div>
            <span className={`text-lg font-mono font-semibold ${getScoreColor(acceptanceRate)}`} data-testid="text-rws-advanced-acceptance">
              {acceptanceRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={acceptanceRate} className={getProgressColor(acceptanceRate)} />
          <p className="text-xs text-muted-foreground">
            Принято: {acceptedBids} из {totalBids} ставок
          </p>
        </div>

        {/* Reliability Score */}
        <div className="space-y-2" data-testid="section-rws-advanced-reliability">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">Индекс надежности</span>
            </div>
            <span className={`text-lg font-mono font-semibold ${getScoreColor(reliabilityScore)}`} data-testid="text-rws-advanced-reliability">
              {reliabilityScore.toFixed(1)}
            </span>
          </div>
          <Progress value={reliabilityScore} className={getProgressColor(reliabilityScore)} />
          <p className="text-xs text-muted-foreground">
            Комбинированная оценка на основе OTD (40%), принятия заявок (30%) и отзывов (30%)
          </p>
        </div>

        {/* Recommendation Criteria Info */}
        {!isRecommended && totalTransactions >= 3 && (
          <div className="p-4 bg-muted/50 rounded-lg border border-dashed" data-testid="section-rws-advanced-criteria">
            <p className="text-sm font-medium mb-2">Критерии для статуса "Рекомендованный":</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className={totalTransactions >= 5 ? "text-green-600 dark:text-green-400" : ""}>
                ✓ Минимум 5 завершенных сделок {totalTransactions >= 5 ? "✓" : `(${totalTransactions}/5)`}
              </li>
              <li className={otdRate >= 85 ? "text-green-600 dark:text-green-400" : ""}>
                ✓ OTD ≥ 85% {otdRate >= 85 ? "✓" : `(${otdRate.toFixed(1)}%)`}
              </li>
              <li className={acceptanceRate >= 70 ? "text-green-600 dark:text-green-400" : ""}>
                ✓ Acceptance Rate ≥ 70% {acceptanceRate >= 70 ? "✓" : `(${acceptanceRate.toFixed(1)}%)`}
              </li>
              <li>✓ Средняя оценка ≥ 4.0/5</li>
            </ul>
          </div>
        )}

        {isRecommended && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800" data-testid="section-rws-advanced-congratulations">
            <div className="flex items-start gap-2">
              <Award className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Вы получили статус "Рекомендованный перевозчик"
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Ваш профиль будет показан приоритетно грузоотправителям. Продолжайте поддерживать высокое качество обслуживания!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
