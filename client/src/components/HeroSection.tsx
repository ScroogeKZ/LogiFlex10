import { Button } from "@/components/ui/button";
import { TruckIcon, PackageIcon, ShieldCheckIcon, BarChart3Icon } from "lucide-react";
import heroImage from "@assets/generated_images/Logistics_hero_warehouse_scene_cd2ca2fb.png";

export default function HeroSection() {
  return (
    <div className="relative h-[600px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Modern logistics operations" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/50" />
      </div>
      
      <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center">
        <div className="max-w-2xl text-white">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Надежная логистика для Казахстана
          </h1>
          <p className="text-xl mb-8 text-white/90">
            Маркетплейс грузоперевозок с государственной интеграцией, системой качества RWS и умным подбором перевозчиков
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button 
              size="lg" 
              variant="default"
              data-testid="button-get-started"
              className="h-12 px-8"
            >
              Начать работу
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              data-testid="button-learn-more"
              className="h-12 px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              Узнать больше
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <TruckIcon className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">500+</div>
                <div className="text-sm text-white/70">Перевозчиков</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PackageIcon className="w-8 h-8 text-accent" />
              <div>
                <div className="text-2xl font-bold">2,000+</div>
                <div className="text-sm text-white/70">Активных грузов</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">98%</div>
                <div className="text-sm text-white/70">Надежность</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3Icon className="w-8 h-8 text-accent" />
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-white/70">Поддержка</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}