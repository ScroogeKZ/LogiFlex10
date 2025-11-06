import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cargo, Bid, User, insertBidSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MapPinIcon, CalendarIcon, PackageIcon, TruckIcon, MessageSquareIcon, CheckCircle2Icon, XCircleIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BidWithCarrier = Bid & {
  carrier?: User;
};

const bidFormSchema = insertBidSchema.extend({
  bidAmount: z.string().min(1, "Укажите цену").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Цена должна быть больше 0"),
  deliveryTime: z.string().min(1, "Укажите срок доставки"),
  vehicleType: z.string().min(1, "Выберите тип транспорта"),
});

type BidFormValues = z.infer<typeof bidFormSchema>;

export default function CargoDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bidDialogOpen, setBidDialogOpen] = useState(false);

  const bidForm = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      cargoId: id,
      bidAmount: "",
      deliveryTime: "",
      vehicleType: "truck",
      message: "",
    },
  });

  const { data: cargo, isLoading: cargoLoading, isError: cargoError } = useQuery<Cargo>({
    queryKey: ["/api/cargo", id],
    enabled: !!id,
  });

  const { data: bids, isLoading: bidsLoading, isError: bidsError, error: bidsErrorData } = useQuery<BidWithCarrier[]>({
    queryKey: ["/api/cargo", id, "bids"],
    enabled: !!id && !!cargo,
  });

  const placeBidMutation = useMutation({
    mutationFn: async (data: BidFormValues) => {
      const res = await apiRequest("POST", "/api/bids", {
        cargoId: id,
        bidAmount: data.bidAmount,
        deliveryTime: data.deliveryTime,
        vehicleType: data.vehicleType,
        message: data.message || undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cargo", id, "bids"] });
      toast({
        title: "Ставка размещена",
        description: "Ваше предложение отправлено грузовладельцу",
      });
      setBidDialogOpen(false);
      bidForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка размещения ставки",
        description: error.message || "Не удалось разместить ставку",
        variant: "destructive",
      });
    },
  });

  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const res = await apiRequest("PATCH", `/api/bids/${bidId}/status`, { status: "accepted" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cargo", id, "bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cargo", id] });
      toast({
        title: "Ставка принята",
        description: "Транзакция создана, перевозчик уведомлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось принять ставку",
        variant: "destructive",
      });
    },
  });

  const rejectBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const res = await apiRequest("PATCH", `/api/bids/${bidId}/status`, { status: "rejected" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cargo", id, "bids"] });
      toast({
        title: "Ставка отклонена",
      });
    },
  });

  if (cargoLoading) {
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

  if (cargoError || !cargo) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Груз не найден
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Этот груз не существует или был удален.
              </p>
              <Button onClick={() => navigate("/")} data-testid="button-back-home">
                Вернуться на главную
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const currentUser = user as User | undefined;
  const isOwner = currentUser?.id === cargo.userId;
  const isCarrier = currentUser?.role === "carrier";
  const canPlaceBid = isCarrier && cargo.status === "active" && !isOwner;
  const userHasBid = currentUser ? bids?.some(bid => bid.carrierId === currentUser.id) : false;

  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    in_progress: "bg-blue-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    active: "Активный",
    in_progress: "В пути",
    completed: "Завершен",
    cancelled: "Отменен",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            ← Назад
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2" data-testid="text-cargo-title">
                      {cargo.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[cargo.status]} data-testid={`badge-status-${cargo.status}`}>
                        {statusLabels[cargo.status]}
                      </Badge>
                      <Badge variant="outline" data-testid="text-cargo-category">
                        {cargo.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Стартовая цена</div>
                    <div className="text-2xl font-bold text-primary" data-testid="text-cargo-price">
                      {Number(cargo.price).toLocaleString()} ₸
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {cargo.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Описание</h3>
                    <p className="text-muted-foreground" data-testid="text-cargo-description">
                      {cargo.description}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Откуда</div>
                      <div className="font-medium" data-testid="text-cargo-origin">{cargo.origin}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Куда</div>
                      <div className="font-medium" data-testid="text-cargo-destination">{cargo.destination}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <PackageIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Вес груза</div>
                      <div className="font-medium" data-testid="text-cargo-weight">
                        {Number(cargo.weight).toFixed(2)} тонн
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Дата погрузки</div>
                      <div className="font-medium" data-testid="text-cargo-pickup">
                        {format(new Date(cargo.pickupDate), "PPP", { locale: ru })}
                      </div>
                    </div>
                  </div>
                </div>

                {cargo.deliveryDate && (
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Желаемая дата доставки</div>
                      <div className="font-medium" data-testid="text-cargo-delivery">
                        {format(new Date(cargo.deliveryDate), "PPP", { locale: ru })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bids Section */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Предложения перевозчиков</CardTitle>
                  <CardDescription>
                    {bids && bids.length > 0
                      ? `Получено ${bids.length} ${bids.length === 1 ? 'предложение' : 'предложений'}`
                      : 'Пока нет предложений'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bidsLoading ? (
                    <div className="flex items-center justify-center py-8" data-testid="loader-bids">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : bidsError ? (
                    <div className="text-center py-8" data-testid="error-bids">
                      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Не удалось загрузить предложения
                      </p>
                    </div>
                  ) : bids && bids.length > 0 ? (
                    <div className="space-y-4">
                      {bids.map((bid) => (
                        <Card key={bid.id} data-testid={`card-bid-${bid.id}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex-1">
                                <div className="font-semibold mb-1">
                                  {bid.carrier?.firstName || "Перевозчик"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {bid.carrier?.companyName}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary" data-testid={`text-bid-amount-${bid.id}`}>
                                  {Number(bid.bidAmount).toLocaleString()} ₸
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {bid.deliveryTime}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <TruckIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{bid.vehicleType}</span>
                            </div>

                            {bid.message && (
                              <div className="bg-muted/50 rounded-md p-3 mb-4">
                                <div className="text-sm">{bid.message}</div>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  bid.status === "accepted"
                                    ? "default"
                                    : bid.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                                data-testid={`badge-bid-status-${bid.id}`}
                              >
                                {bid.status === "accepted"
                                  ? "Принято"
                                  : bid.status === "rejected"
                                  ? "Отклонено"
                                  : "На рассмотрении"}
                              </Badge>

                              {bid.status === "pending" && (
                                <div className="ml-auto flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => acceptBidMutation.mutate(bid.id)}
                                    disabled={acceptBidMutation.isPending}
                                    data-testid={`button-accept-bid-${bid.id}`}
                                  >
                                    <CheckCircle2Icon className="w-4 h-4 mr-1" />
                                    Принять
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectBidMutation.mutate(bid.id)}
                                    disabled={rejectBidMutation.isPending}
                                    data-testid={`button-reject-bid-${bid.id}`}
                                  >
                                    <XCircleIcon className="w-4 h-4 mr-1" />
                                    Отклонить
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Ожидаем предложений от перевозчиков
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {canPlaceBid && (
              <Card>
                <CardHeader>
                  <CardTitle>Разместить ставку</CardTitle>
                  <CardDescription>
                    Предложите свои условия перевозки
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userHasBid ? (
                    <div className="text-center py-4">
                      <CheckCircle2Icon className="w-12 h-12 text-primary mx-auto mb-2" />
                      <p className="font-medium mb-1">Вы уже разместили ставку</p>
                      <p className="text-sm text-muted-foreground">
                        Ожидайте ответа грузовладельца
                      </p>
                    </div>
                  ) : (
                    <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" data-testid="button-place-bid">
                          <TruckIcon className="w-4 h-4 mr-2" />
                          Предложить цену
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="dialog-place-bid">
                        <DialogHeader>
                          <DialogTitle>Разместить ставку</DialogTitle>
                          <DialogDescription>
                            Укажите свою цену и условия перевозки
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...bidForm}>
                          <form onSubmit={bidForm.handleSubmit((data) => placeBidMutation.mutate(data))} className="space-y-4 py-4">
                            <FormField
                              control={bidForm.control}
                              name="bidAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ваша цена (₸) *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="Введите цену"
                                      data-testid="input-bid-amount"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={bidForm.control}
                              name="deliveryTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Срок доставки *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Например: 3 дня"
                                      data-testid="input-delivery-time"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={bidForm.control}
                              name="vehicleType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Тип транспорта *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-vehicle-type">
                                        <SelectValue placeholder="Выберите тип" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="truck" data-testid="option-truck">Грузовик</SelectItem>
                                      <SelectItem value="trailer" data-testid="option-trailer">Фура</SelectItem>
                                      <SelectItem value="refrigerated" data-testid="option-refrigerated">Рефрижератор</SelectItem>
                                      <SelectItem value="container" data-testid="option-container">Контейнер</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={bidForm.control}
                              name="message"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Сообщение (опционально)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Дополнительная информация..."
                                      data-testid="input-bid-message"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={placeBidMutation.isPending}
                              data-testid="button-submit-bid"
                            >
                              {placeBidMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Отправка...
                                </>
                              ) : (
                                "Отправить предложение"
                              )}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Создано</span>
                  <span>{format(new Date(cargo.createdAt!), "PP", { locale: ru })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID груза</span>
                  <span className="font-mono text-xs">{cargo.id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
