import FeatureCard from '../FeatureCard';
import { ShieldCheckIcon } from 'lucide-react';

export default function FeatureCardExample() {
  return (
    <div className="p-6">
      <FeatureCard
        icon={ShieldCheckIcon}
        title="Система качества RWS"
        description="Репутационная система для надежности перевозчиков и грузоотправителей"
      />
    </div>
  );
}