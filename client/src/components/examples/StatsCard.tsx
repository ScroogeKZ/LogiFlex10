import StatsCard from '../StatsCard';
import { PackageIcon } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="p-6 max-w-xs">
      <StatsCard
        icon={PackageIcon}
        label="Активные грузы"
        value="1,234"
        change="+12.5%"
        trend="up"
      />
    </div>
  );
}