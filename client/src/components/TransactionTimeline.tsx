import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, CircleIcon, ClockIcon } from "lucide-react";

interface TimelineStep {
  id: string;
  title: string;
  status: "completed" | "current" | "pending";
  timestamp?: string;
  description?: string;
}

interface TransactionTimelineProps {
  steps: TimelineStep[];
}

export default function TransactionTimeline({ steps }: TransactionTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статус сделки</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex-shrink-0">
                  {step.status === "completed" ? (
                    <CheckCircle2Icon className="w-6 h-6 text-accent" />
                  ) : step.status === "current" ? (
                    <ClockIcon className="w-6 h-6 text-primary" />
                  ) : (
                    <CircleIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 ${
                    step.status === "completed" ? "bg-accent" : "bg-border"
                  }`} />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{step.title}</h4>
                  {step.status === "current" && (
                    <Badge variant="outline" className="text-xs">Текущий</Badge>
                  )}
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground mb-1">{step.description}</p>
                )}
                {step.timestamp && (
                  <p className="text-xs text-muted-foreground font-mono">{step.timestamp}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}