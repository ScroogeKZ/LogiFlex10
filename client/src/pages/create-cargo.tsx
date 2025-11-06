import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertCargoSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TruckIcon, PackageIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const createCargoFormSchema = insertCargoSchema.extend({
  pickupDate: z.date({
    required_error: "Выберите дату погрузки",
  }),
  deliveryDate: z.date().optional(),
});

type CreateCargoFormValues = z.infer<typeof createCargoFormSchema>;

const cargoCategories = [
  { value: "general", label: "Генеральные грузы" },
  { value: "refrigerated", label: "Рефрижераторные" },
  { value: "bulk", label: "Навалочные" },
  { value: "container", label: "Контейнерные" },
  { value: "hazardous", label: "Опасные грузы" },
  { value: "oversized", label: "Негабаритные" },
];

export default function CreateCargoPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<CreateCargoFormValues>({
    resolver: zodResolver(createCargoFormSchema),
    defaultValues: {
      title: "",
      description: undefined,
      category: "general",
      origin: "",
      destination: "",
      weight: "0",
      price: "0",
      status: "active",
    },
  });

  const createCargoMutation = useMutation({
    mutationFn: async (data: CreateCargoFormValues) => {
      const formattedData = {
        ...data,
        pickupDate: data.pickupDate.toISOString(),
        deliveryDate: data.deliveryDate?.toISOString(),
      };
      const res = await apiRequest("POST", "/api/cargo", formattedData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cargo"] });
      toast({
        title: "Груз создан",
        description: "Ваша заявка успешно размещена на платформе",
      });
      navigate(`/cargo/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка создания груза",
        description: error.message || "Не удалось создать груз",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCargoFormValues) => {
    createCargoMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Создать заявку на перевозку</h1>
          <p className="text-muted-foreground">
            Заполните форму для размещения груза на аукционе
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="w-5 h-5" />
              Информация о грузе
            </CardTitle>
            <CardDescription>
              Укажите детали груза для перевозчиков
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название груза *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Пиломатериалы 20 тонн"
                          data-testid="input-cargo-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Детали груза, особые требования к транспорту..."
                          className="min-h-[100px]"
                          data-testid="input-cargo-description"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Укажите важные детали для перевозчика
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категория груза *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-cargo-category">
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cargoCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пункт отправления *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Город, область"
                            data-testid="input-cargo-origin"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пункт назначения *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Город, область"
                            data-testid="input-cargo-destination"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Вес (тонн) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            data-testid="input-cargo-weight"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Стартовая цена (₸) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            data-testid="input-cargo-price"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Перевозчики могут предложить более низкую цену
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="pickupDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Дата погрузки *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal"
                                data-testid="button-pickup-date"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ru })
                                ) : (
                                  <span className="text-muted-foreground">Выберите дату</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Желаемая дата доставки</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal"
                                data-testid="button-delivery-date"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ru })
                                ) : (
                                  <span className="text-muted-foreground">Опционально</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Необязательное поле
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    data-testid="button-cancel"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCargoMutation.isPending}
                    data-testid="button-submit-cargo"
                  >
                    <TruckIcon className="w-4 h-4 mr-2" />
                    {createCargoMutation.isPending ? "Создание..." : "Разместить груз"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
