import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import { Link } from "wouter";
import { MapPin, Package, Calendar, DollarSign, Search } from "lucide-react";
import type { Cargo } from "@shared/schema";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: allCargo = [], isLoading } = useQuery<Cargo[]>({
    queryKey: ["/api/cargo"],
  });

  const activeCargo = allCargo.filter(cargo => cargo.status === "active");
  
  const filteredCargo = activeCargo.filter(cargo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cargo.title.toLowerCase().includes(query) ||
      cargo.category.toLowerCase().includes(query) ||
      cargo.origin.toLowerCase().includes(query) ||
      cargo.destination.toLowerCase().includes(query)
    );
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: "Обычный груз",
      fragile: "Хрупкий груз",
      perishable: "Скоропортящийся",
      hazardous: "Опасный груз",
      oversized: "Негабаритный груз",
    };
    return labels[category] || category;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" data-testid="text-page-title">
            Маркетплейс грузов
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-page-description">
            Найдите груз для перевозки или разместите свой груз
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск по названию, категории или маршруту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCargo.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-cargo">
                {searchQuery ? "Ничего не найдено" : "Нет активных грузов"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Попробуйте изменить параметры поиска"
                  : "Грузы появятся здесь, как только они будут добавлены"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCargo.map((cargo) => (
              <Link key={cargo.id} href={`/cargo/${cargo.id}`} data-testid={`link-cargo-${cargo.id}`}>
                <Card 
                  className="hover-elevate cursor-pointer transition-all duration-300 h-full"
                  data-testid={`card-cargo-${cargo.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {cargo.title}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {getCategoryLabel(cargo.category)}
                      </Badge>
                    </div>
                    {cargo.description && (
                      <CardDescription className="line-clamp-2">
                        {cargo.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cargo.origin}</div>
                        <div className="text-muted-foreground">↓</div>
                        <div className="font-medium truncate">{cargo.destination}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Вес: <span className="font-medium text-foreground">{cargo.weight} кг</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Погрузка:{" "}
                        <span className="font-medium text-foreground">
                          {cargo.pickupDate && format(new Date(cargo.pickupDate), "dd MMM yyyy", { locale: ru })}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="text-xl font-bold text-primary">
                          {cargo.price}₸
                        </span>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-view-${cargo.id}`} asChild>
                        <a>Подробнее</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
