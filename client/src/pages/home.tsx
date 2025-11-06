import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";
import CargoCard from "@/components/CargoCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheckIcon, 
  BarChart3Icon, 
  FileTextIcon, 
  ZapIcon,
  ArrowRightIcon 
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Cargo } from "@shared/schema";
import { Loader2 } from "lucide-react";
import CargoCardSkeleton from "@/components/skeletons/CargoCardSkeleton";

export default function HomePage() {
  const { data: cargoList, isLoading, isError, error, refetch } = useQuery<Cargo[]>({
    queryKey: ["/api/cargo"],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
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
        
        <section className="bg-card py-12 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Активные грузы</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Найдите подходящие грузы для перевозки
                </p>
              </div>
              <Link href="/cargo" className="no-underline">
                <Button variant="outline" data-testid="button-view-all-cargo" className="w-full sm:w-auto">
                  Все грузы
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CargoCardSkeleton />
                <CargoCardSkeleton />
                <CargoCardSkeleton />
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <p className="text-destructive text-lg mb-4">
                  Ошибка загрузки грузов
                </p>
                <p className="text-muted-foreground text-sm mb-6">
                  {error instanceof Error ? error.message : 'Не удалось загрузить данные'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                  data-testid="button-retry-cargo"
                >
                  Попробовать снова
                </Button>
              </div>
            ) : cargoList && cargoList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cargoList.slice(0, 3).map(cargo => (
                  <CargoCard 
                    key={cargo.id} 
                    id={cargo.id}
                    title={cargo.title}
                    origin={cargo.origin}
                    destination={cargo.destination}
                    weight={parseFloat(cargo.weight)}
                    price={parseFloat(cargo.price)}
                    pickupDate={new Date(cargo.pickupDate).toISOString().split('T')[0]}
                    status={cargo.status}
                    category={cargo.category}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  Пока нет активных грузов. Создайте первый груз!
                </p>
              </div>
            )}
          </div>
        </section>
        
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-primary text-primary-foreground rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Готовы начать работу?
            </h2>
            <p className="text-lg mb-8 text-primary-foreground/90">
              Присоединяйтесь к надежной логистической платформе Казахстана
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                variant="secondary"
                data-testid="button-register-carrier"
                className="h-12 px-8"
              >
                Зарегистрироваться как перевозчик
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                data-testid="button-register-shipper"
                className="h-12 px-8 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              >
                Зарегистрироваться как грузоотправитель
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}