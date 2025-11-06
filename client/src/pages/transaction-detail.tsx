import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Transaction, Cargo, Bid, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TransactionTimeline from "@/components/TransactionTimeline";
import TransactionChat from "@/components/TransactionChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MapPinIcon, PackageIcon, TruckIcon, CalendarIcon, AlertCircle, StarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type TransactionWithDetails = Transaction & {
  cargo?: Cargo;
  bid?: Bid;
  shipper?: User;
  carrier?: User;
};

export default function TransactionDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const currentUser = user as User | undefined;
  const { toast } = useToast();
  
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratings, setRatings] = useState({
    onTimeDelivery: 5,
    cargoCondition: 5,
    communication: 5,
    documentation: 5,
  });
  const [ratingComment, setRatingComment] = useState("");

  const { data: transaction, isLoading, isError } = useQuery<TransactionWithDetails>({
    queryKey: ["/api/transactions", id],
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PATCH", `/api/transactions/${id}/status`, { status: newStatus });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", id] });
      toast({
        title: "Статус обновлен",
        description: "Статус транзакции успешно изменен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус",
        variant: "destructive",
      });
    },
  });

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      if (!transaction?.shipperId || !transaction?.carrierId) {
        throw new Error("Не удалось определить контрагента для оценки");
      }

      const overall = Math.round(
        (ratings.onTimeDelivery + ratings.cargoCondition + ratings.communication + ratings.documentation) / 4
      );
      
      const userId = currentUser?.id === transaction?.shipperId 
        ? transaction?.carrierId 
        : transaction?.shipperId;

      if (!userId) {
        throw new Error("Не удалось определить получателя оценки");
      }

      const res = await apiRequest("POST", "/api/rws", {
        userId,
        transactionId: id,
        onTimeDelivery: ratings.onTimeDelivery,
        cargoCondition: ratings.cargoCondition,
        communication: ratings.communication,
        documentation: ratings.documentation,
        overallScore: overall,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", id] });
      toast({
        title: "Оценка отправлена",
        description: "Спасибо за ваш отзыв!",
      });
      setRatingDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить оценку",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Транзакция не найдена
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Эта транзакция не существует или была удалена.
              </p>
              <Button onClick={() => navigate("/dashboard")} data-testid="button-back-dashboard">
                Вернуться в панель
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const isShipper = currentUser?.id === transaction.shipperId;
  const isCarrier = currentUser?.id === transaction.carrierId;
  const canRate = transaction.status === "completed" && (isShipper || isCarrier);

  const statusColors: Record<string, string> = {
    created: "bg-blue-500",
    confirmed: "bg-green-500",
    in_transit: "bg-yellow-500",
    delivered: "bg-purple-500",
    completed: "bg-gray-500",
    disputed: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    created: "Создана",
    confirmed: "Подтверждена",
    in_transit: "В пути",
    delivered: "Доставлена",
    completed: "Завершена",
    disputed: "Спорная",
  };

  const overallRating = Math.round(
    (ratings.onTimeDelivery + ratings.cargoCondition + ratings.communication + ratings.documentation) / 4
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            data-testid="button-back"
          >
            ← Назад
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Транзакция</h1>
            <Badge className={statusColors[transaction.status]} data-testid={`badge-status-${transaction.status}`}>
              {statusLabels[transaction.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            ID: {transaction.id.slice(0, 16)}...
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Детали груза</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.cargo && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2" data-testid="text-cargo-title">
                        {transaction.cargo.title}
                      </h3>
                      <Badge variant="outline">{transaction.cargo.category}</Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="text-sm text-muted-foreground">Откуда</div>
                          <div className="font-medium">{transaction.cargo.origin}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 text-accent mt-0.5" />
                        <div>
                          <div className="text-sm text-muted-foreground">Куда</div>
                          <div className="font-medium">{transaction.cargo.destination}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <PackageIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="text-sm text-muted-foreground">Вес</div>
                          <div className="font-medium">{Number(transaction.cargo.weight).toFixed(2)} тонн</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="text-sm text-muted-foreground">Дата погрузки</div>
                          <div className="font-medium">
                            {format(new Date(transaction.cargo.pickupDate), "PPP", { locale: ru })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Условия перевозки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.bid && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Стоимость</div>
                      <div className="text-2xl font-bold text-primary">
                        {Number(transaction.bid.bidAmount).toLocaleString()} ₸
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Срок доставки</div>
                      <div className="font-medium">{transaction.bid.deliveryTime}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TruckIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{transaction.bid.vehicleType}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статус доставки</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionTimeline steps={[
                  {
                    id: "created",
                    title: "Сделка создана",
                    status: transaction.status === "created" ? "current" : "completed",
                    timestamp: format(new Date(transaction.createdAt!), "PPpp", { locale: ru }),
                  },
                  {
                    id: "confirmed",
                    title: "Подтверждена грузоотправителем",
                    status: transaction.status === "created" ? "pending" : transaction.status === "confirmed" ? "current" : "completed",
                    timestamp: transaction.status !== "created" ? format(new Date(transaction.updatedAt!), "PPpp", { locale: ru }) : undefined,
                  },
                  {
                    id: "in_transit",
                    title: "В пути",
                    status: ["created", "confirmed"].includes(transaction.status) ? "pending" : transaction.status === "in_transit" ? "current" : "completed",
                  },
                  {
                    id: "delivered",
                    title: "Груз доставлен",
                    status: ["created", "confirmed", "in_transit"].includes(transaction.status) ? "pending" : transaction.status === "delivered" ? "current" : "completed",
                  },
                  {
                    id: "completed",
                    title: "Сделка завершена",
                    status: transaction.status === "completed" ? "completed" : "pending",
                    timestamp: transaction.completedAt ? format(new Date(transaction.completedAt), "PPpp", { locale: ru }) : undefined,
                  },
                ]} />
                
                {(isShipper || isCarrier) && transaction.status !== "completed" && transaction.status !== "disputed" && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground mb-3">Обновить статус:</div>
                    <div className="flex flex-wrap gap-2">
                      {isShipper && transaction.status === "created" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate("confirmed")}
                          disabled={updateStatusMutation.isPending}
                          data-testid="button-confirm"
                        >
                          Подтвердить
                        </Button>
                      )}
                      {isCarrier && transaction.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate("in_transit")}
                          disabled={updateStatusMutation.isPending}
                          data-testid="button-in-transit"
                        >
                          В пути
                        </Button>
                      )}
                      {isCarrier && transaction.status === "in_transit" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate("delivered")}
                          disabled={updateStatusMutation.isPending}
                          data-testid="button-delivered"
                        >
                          Доставлено
                        </Button>
                      )}
                      {isShipper && transaction.status === "delivered" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate("completed")}
                          disabled={updateStatusMutation.isPending}
                          data-testid="button-complete"
                        >
                          Завершить
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Участники</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Грузоотправитель</div>
                  <div className="font-medium">{transaction.shipper?.firstName || "Не указано"}</div>
                  {transaction.shipper?.companyName && (
                    <div className="text-sm text-muted-foreground">{transaction.shipper.companyName}</div>
                  )}
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Перевозчик</div>
                  <div className="font-medium">{transaction.carrier?.firstName || "Не указано"}</div>
                  {transaction.carrier?.companyName && (
                    <div className="text-sm text-muted-foreground">{transaction.carrier.companyName}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <TransactionChat
              transactionId={transaction.id}
              currentUser={currentUser}
              shipperId={transaction.shipperId}
              carrierId={transaction.carrierId}
            />

            {canRate && (
              <Card>
                <CardHeader>
                  <CardTitle>Оценить партнера</CardTitle>
                  <CardDescription>
                    Поделитесь опытом работы
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" data-testid="button-rate">
                        <StarIcon className="w-4 h-4 mr-2" />
                        Оставить оценку
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md" data-testid="dialog-rating">
                      <DialogHeader>
                        <DialogTitle>Оценка качества</DialogTitle>
                        <DialogDescription>
                          Оцените работу {isShipper ? "перевозчика" : "грузоотправителя"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div>
                          <Label className="mb-2">Своевременность доставки: {ratings.onTimeDelivery}/5</Label>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[ratings.onTimeDelivery]}
                            onValueChange={(v) => setRatings({...ratings, onTimeDelivery: v[0]})}
                            data-testid="slider-on-time"
                          />
                        </div>
                        <div>
                          <Label className="mb-2">Состояние груза: {ratings.cargoCondition}/5</Label>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[ratings.cargoCondition]}
                            onValueChange={(v) => setRatings({...ratings, cargoCondition: v[0]})}
                            data-testid="slider-cargo-condition"
                          />
                        </div>
                        <div>
                          <Label className="mb-2">Коммуникация: {ratings.communication}/5</Label>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[ratings.communication]}
                            onValueChange={(v) => setRatings({...ratings, communication: v[0]})}
                            data-testid="slider-communication"
                          />
                        </div>
                        <div>
                          <Label className="mb-2">Документация: {ratings.documentation}/5</Label>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[ratings.documentation]}
                            onValueChange={(v) => setRatings({...ratings, documentation: v[0]})}
                            data-testid="slider-documentation"
                          />
                        </div>
                        <Separator />
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">Общая оценка</div>
                          <div className="text-3xl font-bold flex items-center justify-center gap-2">
                            {overallRating}
                            <StarIcon className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="comment">Комментарий (необязательно)</Label>
                          <Textarea
                            id="comment"
                            placeholder="Поделитесь деталями..."
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            data-testid="input-rating-comment"
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => submitRatingMutation.mutate()}
                          disabled={submitRatingMutation.isPending}
                          data-testid="button-submit-rating"
                        >
                          {submitRatingMutation.isPending ? "Отправка..." : "Отправить оценку"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Создана</span>
                  <span>{format(new Date(transaction.createdAt!), "PPP", { locale: ru })}</span>
                </div>
                {transaction.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Завершена</span>
                    <span>{format(new Date(transaction.completedAt), "PPP", { locale: ru })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
