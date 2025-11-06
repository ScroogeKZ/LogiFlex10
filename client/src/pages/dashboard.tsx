import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatsCard from "@/components/StatsCard";
import CargoCard from "@/components/CargoCard";
import BidCard from "@/components/BidCard";
import RWSScore from "@/components/RWSScore";
import TransactionTimeline from "@/components/TransactionTimeline";
import StatsCardSkeleton from "@/components/skeletons/StatsCardSkeleton";
import CargoCardSkeleton from "@/components/skeletons/CargoCardSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PackageIcon, TruckIcon, CheckCircle2Icon, ClockIcon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Cargo } from "@shared/schema";

interface DashboardAnalytics {
  activeCargo: number;
  totalBids: number;
  totalTransactions: number;
  rwsScore: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, error: analyticsErrorData, refetch: refetchAnalytics } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
  });
  
  const { data: cargoList, isLoading: cargoLoading, isError: cargoError, error: cargoErrorData, refetch: refetchCargo } = useQuery<Cargo[]>({
    queryKey: ["/api/cargo"],
  });
  
  const activeCargo = cargoList?.filter(c => c.status === "active") || [];
  const inProgressCargo = cargoList?.filter(c => c.status === "in_progress") || [];
  const completedCargo = cargoList?.filter(c => c.status === "completed") || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Панель управления</h1>
          <p className="text-muted-foreground">
            Управляйте грузами и отслеживайте сделки
          </p>
        </div>
        
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        ) : analyticsError ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-8">
            <p className="text-destructive font-semibold mb-2">
              Ошибка загрузки аналитики
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {analyticsErrorData instanceof Error ? analyticsErrorData.message : 'Не удалось загрузить статистику'}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchAnalytics()}
              data-testid="button-retry-analytics"
            >
              Попробовать снова
            </Button>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={PackageIcon}
              label="Активные грузы"
              value={String(analytics.activeCargo)}
            />
            <StatsCard
              icon={TruckIcon}
              label="Получено предложений"
              value={String(analytics.totalBids)}
            />
            <StatsCard
              icon={ClockIcon}
              label="Грузы в пути"
              value={String(inProgressCargo.length)}
            />
            <StatsCard
              icon={CheckCircle2Icon}
              label="Завершено"
              value={String(completedCargo.length)}
            />
          </div>
        ) : null}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList data-testid="tabs-dashboard">
            <TabsTrigger value="overview" data-testid="tab-overview">Обзор</TabsTrigger>
            <TabsTrigger value="cargo" data-testid="tab-cargo">Мои грузы</TabsTrigger>
            <TabsTrigger value="bids" data-testid="tab-bids">Предложения</TabsTrigger>
            <TabsTrigger value="quality" data-testid="tab-quality">Качество</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {cargoLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CargoCardSkeleton />
                <CargoCardSkeleton />
                <CargoCardSkeleton />
              </div>
            ) : cargoError ? (
              <div className="text-center py-12">
                <p className="text-destructive text-lg mb-4">
                  Ошибка загрузки грузов
                </p>
                <p className="text-muted-foreground text-sm mb-6">
                  {cargoErrorData instanceof Error ? cargoErrorData.message : 'Не удалось загрузить данные'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => refetchCargo()}
                  data-testid="button-retry-cargo-overview"
                >
                  Попробовать снова
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Последние грузы</h3>
                  {cargoList && cargoList.length > 0 ? (
                    cargoList.slice(0, 2).map(cargo => (
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
                    ))
                  ) : (
                    <p className="text-muted-foreground">Нет грузов</p>
                  )}
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Статус сделки</h3>
                  <p className="text-muted-foreground text-sm">
                    Система транзакций будет доступна после создания первого груза
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="cargo" className="space-y-6">
            {cargoLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : cargoError ? (
              <div className="text-center py-12">
                <p className="text-destructive text-lg mb-4">
                  Ошибка загрузки грузов
                </p>
                <p className="text-muted-foreground text-sm mb-6">
                  {cargoErrorData instanceof Error ? cargoErrorData.message : 'Не удалось загрузить данные'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => refetchCargo()}
                  data-testid="button-retry-cargo"
                >
                  Попробовать снова
                </Button>
              </div>
            ) : cargoList && cargoList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cargoList.map(cargo => (
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
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  У вас пока нет грузов. Создайте первый груз!
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bids" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Система ставок будет доступна после создания грузов
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RWSScore
                score={analytics?.rwsScore || 0}
                onTimeDelivery={0}
                cargoCondition={0}
                communication={0}
                documentation={0}
              />
              <div>
                <h3 className="text-xl font-semibold mb-4">Рейтинг качества</h3>
                <p className="text-muted-foreground mb-4">
                  Ваш показатель RWS (Reputation Weight Score) основан на истории доставок и оценках партнеров.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Завершенных доставок:</span>
                    <span className="font-semibold font-mono">{analytics?.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Активных грузов:</span>
                    <span className="font-semibold font-mono">{analytics?.activeCargo || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Общий RWS:</span>
                    <span className="font-semibold font-mono">{analytics?.rwsScore || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}