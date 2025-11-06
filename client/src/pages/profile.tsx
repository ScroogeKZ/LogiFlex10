import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserProfileSchema, type UpdateUserProfile, type User, type RWSMetric } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import RWSAdvancedMetrics from "@/components/RWSAdvancedMetrics";
import { CheckCircle2, XCircle, Award, Clock, Package, TrendingUp, Truck, FileText } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState, useRef } from "react";

interface AnalyticsData {
  activeCargo: number;
  inProgressCargo: number;
  completedCargo: number;
  totalBids: number;
  totalTransactions: number;
  rwsScore: number;
}

interface ExtendedRWSMetrics {
  rwsScore: number;
  otdRate: number;
  acceptanceRate: number;
  reliabilityScore: number;
  totalTransactions: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  totalBids: number;
  acceptedBids: number;
  isRecommended: boolean;
  ratings: RWSMetric[];
}

export default function ProfilePage() {
  const { user } = useAuth() as { user?: User };
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const previousRoleRef = useRef<string>("");

  const { data: rwsMetrics = [] } = useQuery<RWSMetric[]>({
    queryKey: ["/api/rws", user?.id],
    enabled: !!user?.id,
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/dashboard"],
    enabled: !!user?.id,
  });

  const { data: extendedMetrics } = useQuery<ExtendedRWSMetrics>({
    queryKey: ["/api/rws", user?.id, "extended"],
    queryFn: async () => {
      const response = await fetch(`/api/rws/${user?.id}/extended`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch extended metrics");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const form = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      phone: "",
      bin: "",
      iin: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        companyName: user.companyName ?? "",
        phone: user.phone ?? "",
        bin: user.bin ?? "",
        iin: user.iin ?? "",
      });
      const role = user.role || "shipper";
      setSelectedRole(role);
      previousRoleRef.current = role;
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const response = await fetch("/api/auth/user/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("PATCH", "/api/auth/user/change-role", { role });
      return res.json();
    },
    onSuccess: (data: User) => {
      previousRoleRef.current = data.role;
      setSelectedRole(data.role);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: "Роль изменена",
        description: "Ваша роль успешно обновлена",
      });
    },
    onError: () => {
      setSelectedRole(previousRoleRef.current);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить роль",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateUserProfile) => {
    updateProfileMutation.mutate(data);
  };

  const handleRoleChange = (newRole: string) => {
    if (newRole !== previousRoleRef.current && user?.role !== "admin" && !changeRoleMutation.isPending) {
      previousRoleRef.current = selectedRole;
      setSelectedRole(newRole);
      changeRoleMutation.mutate(newRole);
    }
  };

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case "carrier":
        return "Перевозчик";
      case "shipper":
        return "Грузоотправитель";
      case "admin":
        return "Администратор";
      default:
        return "Пользователь";
    }
  };

  const calculateAverageScore = () => {
    if (rwsMetrics.length === 0) return 0;
    const sum = rwsMetrics.reduce((acc, metric) => acc + metric.overallScore, 0);
    return (sum / rwsMetrics.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Профиль пользователя</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Управляйте своей учетной записью и настройками
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Статус аккаунта</CardTitle>
              <CardDescription>Информация о вашей учетной записи</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-user-email">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Роль</p>
                  <Badge variant="secondary" data-testid="badge-user-role">{getRoleDisplay(user?.role)}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Статус верификации</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user?.isVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500" data-testid="text-verification-status">Верифицирован</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-500" data-testid="text-verification-status">Не верифицирован</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {user?.edsCertId && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">ЭЦП сертификат</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-eds-cert-id">ID: {user.edsCertId}</p>
                    {user.edsCertExpiry && (
                      <p className="text-xs text-muted-foreground">
                        Действителен до: {format(new Date(user.edsCertExpiry), "dd.MM.yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">RWS рейтинг</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-lg font-bold" data-testid="text-rws-score">{calculateAverageScore()}</span>
                    <span className="text-sm text-muted-foreground">({rwsMetrics.length} оценок)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Статистика активности</CardTitle>
                <CardDescription>Обзор вашей деятельности на платформе</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <Package className="w-8 h-8 text-primary mb-2" />
                    <span className="text-2xl font-bold" data-testid="text-stat-active-cargo">{analytics.activeCargo}</span>
                    <span className="text-sm text-muted-foreground">Активные грузы</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <Truck className="w-8 h-8 text-orange-500 mb-2" />
                    <span className="text-2xl font-bold" data-testid="text-stat-in-progress">{analytics.inProgressCargo}</span>
                    <span className="text-sm text-muted-foreground">В пути</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-2xl font-bold" data-testid="text-stat-completed">{analytics.completedCargo}</span>
                    <span className="text-sm text-muted-foreground">Завершено</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <TrendingUp className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-2xl font-bold" data-testid="text-stat-bids">{analytics.totalBids}</span>
                    <span className="text-sm text-muted-foreground">
                      {user?.role === "carrier" ? "Мои ставки" : "Получено ставок"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <FileText className="w-8 h-8 text-purple-500 mb-2" />
                    <span className="text-2xl font-bold" data-testid="text-stat-transactions">{analytics.totalTransactions}</span>
                    <span className="text-sm text-muted-foreground">Транзакции</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                    <Award className="w-8 h-8 text-yellow-500 mb-2" />
                    <span className="text-2xl font-bold" data-testid="text-stat-rws">{calculateAverageScore()}</span>
                    <span className="text-sm text-muted-foreground">RWS рейтинг</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {extendedMetrics && (
            <RWSAdvancedMetrics
              rwsScore={extendedMetrics.rwsScore}
              otdRate={extendedMetrics.otdRate}
              acceptanceRate={extendedMetrics.acceptanceRate}
              reliabilityScore={extendedMetrics.reliabilityScore}
              totalTransactions={extendedMetrics.totalTransactions}
              onTimeDeliveries={extendedMetrics.onTimeDeliveries}
              lateDeliveries={extendedMetrics.lateDeliveries}
              totalBids={extendedMetrics.totalBids}
              acceptedBids={extendedMetrics.acceptedBids}
              isRecommended={extendedMetrics.isRecommended}
            />
          )}

          {user?.role !== "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Смена роли</CardTitle>
                <CardDescription>Выберите свою роль на платформе</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={selectedRole} 
                  onValueChange={handleRoleChange}
                  disabled={changeRoleMutation.isPending}
                >
                  <div className={`flex items-center space-x-2 p-3 border rounded-lg ${changeRoleMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'} transition-colors`}>
                    <RadioGroupItem 
                      value="shipper" 
                      id="shipper" 
                      data-testid="radio-role-shipper"
                      disabled={changeRoleMutation.isPending}
                    />
                    <label htmlFor="shipper" className={`flex-1 ${changeRoleMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <div className="font-medium">Грузоотправитель</div>
                      <div className="text-sm text-muted-foreground">Создаю заявки на перевозку грузов</div>
                    </label>
                  </div>
                  <div className={`flex items-center space-x-2 p-3 border rounded-lg ${changeRoleMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'} transition-colors`}>
                    <RadioGroupItem 
                      value="carrier" 
                      id="carrier" 
                      data-testid="radio-role-carrier"
                      disabled={changeRoleMutation.isPending}
                    />
                    <label htmlFor="carrier" className={`flex-1 ${changeRoleMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <div className="font-medium">Перевозчик</div>
                      <div className="text-sm text-muted-foreground">Размещаю ставки на перевозку грузов</div>
                    </label>
                  </div>
                </RadioGroup>
                {changeRoleMutation.isPending && (
                  <p className="text-sm text-muted-foreground mt-2">Изменение роли...</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>Обновите свои персональные данные</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="Иван" data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Фамилия</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="Иванов" data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название компании</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="ТОО 'Логистика Плюс'" data-testid="input-company-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+77001234567" data-testid="input-phone" />
                        </FormControl>
                        <FormDescription>
                          Формат: +77001234567
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>БИН (для компаний)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456789012" maxLength={12} data-testid="input-bin" />
                          </FormControl>
                          <FormDescription>
                            12 цифр БИН компании
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="iin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ИИН (для физ. лиц)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456789012" maxLength={12} data-testid="input-iin" />
                          </FormControl>
                          <FormDescription>
                            12 цифр ИИН физ. лица
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {rwsMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>История оценок RWS</CardTitle>
                <CardDescription>Ваши последние полученные оценки</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rwsMetrics.slice(0, 5).map((metric) => (
                    <div key={metric.id} className="border rounded-lg p-4" data-testid={`card-rws-metric-${metric.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span className="font-semibold" data-testid={`text-rws-score-${metric.id}`}>
                            Общая оценка: {metric.overallScore}/5
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {metric.createdAt && format(new Date(metric.createdAt), "dd.MM.yyyy")}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Доставка</p>
                          <p className="font-medium">{metric.onTimeDelivery}/5</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Состояние</p>
                          <p className="font-medium">{metric.cargoCondition}/5</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Общение</p>
                          <p className="font-medium">{metric.communication}/5</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Документы</p>
                          <p className="font-medium">{metric.documentation}/5</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
