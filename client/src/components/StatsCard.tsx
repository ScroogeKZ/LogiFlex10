import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
}

export default function StatsCard({ icon: Icon, label, value, change, trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {change && (
            <div className={`text-sm font-medium ${
              trend === "up" ? "text-accent-foreground" : "text-destructive"
            }`}>
              {change}
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground mb-1">{label}</div>
        <div className="text-3xl font-bold font-mono">{value}</div>
      </CardContent>
    </Card>
  );
}