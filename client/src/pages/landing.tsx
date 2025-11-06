import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { TruckIcon } from "lucide-react";
import { 
  ShieldCheckIcon, 
  BarChart3Icon, 
  FileTextIcon, 
  ZapIcon 
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="font-bold text-lg sm:text-xl">LogiFlex.kz</span>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Войти
          </Button>
        </div>
      </header>
      
      <main className="flex-1">
        <HeroSection />
        
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Преимущества платформы</h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              Современные технологии для надежной логистики
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={ShieldCheckIcon}
              title="Система RWS"
              description="Репутационная оценка для надежности участников рынка"
            />
            <FeatureCard
              icon={FileTextIcon}
              title="Гос. интеграция"
              description="ЭЦП, электронные накладные и санкционные проверки"
            />
            <FeatureCard
              icon={ZapIcon}
              title="Умный подбор"
              description="Автоматический подбор оптимальных перевозчиков"
            />
            <FeatureCard
              icon={BarChart3Icon}
              title="Аналитика"
              description="Детальная статистика и прогнозы рынка"
            />
          </div>
        </section>
        
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="bg-primary text-primary-foreground rounded-lg p-6 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              Готовы начать работу?
            </h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 text-primary-foreground/90">
              Присоединяйтесь к надежной логистической платформе Казахстана
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-get-started"
              className="h-12 px-8"
            >
              Начать работу
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}