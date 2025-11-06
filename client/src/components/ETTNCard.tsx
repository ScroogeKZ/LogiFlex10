import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileTextIcon, CheckCircle2Icon, ClockIcon, AlertCircleIcon, PenToolIcon, ShieldCheckIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ETTN {
  id: string;
  ettnNumber: string;
  transactionId: string;
  cargoDescription: string;
  origin: string;
  destination: string;
  weight: string;
  shipperId: string;
  carrierId: string;
  shipperSignature: string | null;
  carrierSignature: string | null;
  shipperSignedAt: string | null;
  carrierSignedAt: string | null;
  status: "draft" | "pending_signature" | "partially_signed" | "fully_signed" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface ETTNCardProps {
  ettn: ETTN | null;
  transactionId: string;
  userId: string;
  isShipper: boolean;
  onCreateETTN?: () => void;
}

export default function ETTNCard({ ettn, transactionId, userId, isShipper, onCreateETTN }: ETTNCardProps) {
  const { toast } = useToast();
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!ettn) return;
      return await apiRequest("PATCH", `/api/ettn/${ettn.id}/sign`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", transactionId, "ettn"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", transactionId] });
      setSignDialogOpen(false);
      toast({
        title: "Успешно",
        description: "Е-ТТН успешно подписана",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось подписать е-ТТН",
      });
    },
  });

  if (!ettn && onCreateETTN) {
    return (
      <Card data-testid="card-ettn-create">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Электронная Товарно-Транспортная Накладная (е-ТТН)
          </CardTitle>
          <CardDescription>
            Создайте е-ТТН для легализации перевозки согласно законодательству РК
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Е-ТТН еще не создана для этой транзакции. Создайте документ для подписания обеими сторонами.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={onCreateETTN} 
            className="mt-4 w-full"
            data-testid="button-create-ettn"
          >
            <FileTextIcon className="h-4 w-4 mr-2" />
            Создать е-ТТН
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!ettn) {
    return null;
  }

  const userIsShipper = ettn.shipperId === userId;
  const userHasSigned = userIsShipper ? !!ettn.shipperSignature : !!ettn.carrierSignature;
  const canSign = !userHasSigned && (ettn.status === "pending_signature" || ettn.status === "partially_signed");

  const getStatusBadge = () => {
    switch (ettn.status) {
      case "draft":
        return <Badge variant="secondary" data-testid="badge-ettn-status-draft">Черновик</Badge>;
      case "pending_signature":
        return <Badge variant="outline" className="bg-yellow-50" data-testid="badge-ettn-status-pending"><ClockIcon className="h-3 w-3 mr-1" />Ожидает подписания</Badge>;
      case "partially_signed":
        return <Badge variant="outline" className="bg-blue-50" data-testid="badge-ettn-status-partial"><PenToolIcon className="h-3 w-3 mr-1" />Частично подписана</Badge>;
      case "fully_signed":
        return <Badge variant="default" className="bg-green-600" data-testid="badge-ettn-status-signed"><CheckCircle2Icon className="h-3 w-3 mr-1" />Полностью подписана</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-700" data-testid="badge-ettn-status-completed"><ShieldCheckIcon className="h-3 w-3 mr-1" />Завершена</Badge>;
      default:
        return <Badge variant="secondary">{ettn.status}</Badge>;
    }
  };

  return (
    <Card data-testid="card-ettn-detail">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            е-ТТН {ettn.ettnNumber}
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Электронная товарно-транспортная накладная для перевозки груза
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Маршрут</p>
            <p className="font-medium" data-testid="text-ettn-route">{ettn.origin} → {ettn.destination}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Вес груза</p>
            <p className="font-medium" data-testid="text-ettn-weight">{ettn.weight} кг</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Описание груза</p>
          <p className="font-medium" data-testid="text-ettn-cargo">{ettn.cargoDescription}</p>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Статус подписей</h4>
          
          <div className="flex items-center gap-3">
            {ettn.shipperSignature ? (
              <CheckCircle2Icon className="h-5 w-5 text-green-600" data-testid="icon-shipper-signed" />
            ) : (
              <ClockIcon className="h-5 w-5 text-gray-400" data-testid="icon-shipper-pending" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Грузоотправитель</p>
              {ettn.shipperSignedAt && (
                <p className="text-xs text-muted-foreground" data-testid="text-shipper-signed-date">
                  Подписано {format(new Date(ettn.shipperSignedAt), "d MMMM yyyy, HH:mm", { locale: ru })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {ettn.carrierSignature ? (
              <CheckCircle2Icon className="h-5 w-5 text-green-600" data-testid="icon-carrier-signed" />
            ) : (
              <ClockIcon className="h-5 w-5 text-gray-400" data-testid="icon-carrier-pending" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Перевозчик</p>
              {ettn.carrierSignedAt && (
                <p className="text-xs text-muted-foreground" data-testid="text-carrier-signed-date">
                  Подписано {format(new Date(ettn.carrierSignedAt), "d MMMM yyyy, HH:mm", { locale: ru })}
                </p>
              )}
            </div>
          </div>
        </div>

        {canSign && (
          <>
            <Separator />
            <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" data-testid="button-sign-ettn">
                  <PenToolIcon className="h-4 w-4 mr-2" />
                  Подписать е-ТТН
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-sign-ettn">
                <DialogHeader>
                  <DialogTitle>Подписание е-ТТН</DialogTitle>
                  <DialogDescription>
                    Вы собираетесь подписать электронную товарно-транспортную накладную используя mock ЭЦП.
                    В реальной системе потребуется настоящий сертификат ЭЦП.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Alert>
                    <ShieldCheckIcon className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Mock ЭЦП:</strong> В демонстрационном режиме используется симулированная цифровая подпись.
                      Для production требуется интеграция с реальным провайдером ЭЦП (НУЦ РК).
                    </AlertDescription>
                  </Alert>
                  
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2">Данные для подписи:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>Номер: {ettn.ettnNumber}</li>
                      <li>Груз: {ettn.cargoDescription}</li>
                      <li>Маршрут: {ettn.origin} → {ettn.destination}</li>
                      <li>Вес: {ettn.weight} кг</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={() => signMutation.mutate()} 
                    disabled={signMutation.isPending}
                    className="w-full"
                    data-testid="button-confirm-sign-ettn"
                  >
                    {signMutation.isPending ? "Подписание..." : "Подтвердить подпись"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {userHasSigned && !canSign && (
          <Alert>
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertDescription data-testid="alert-already-signed">
              Вы уже подписали эту е-ТТН. 
              {ettn.status === "partially_signed" && " Ожидание подписи другой стороны."}
              {ettn.status === "fully_signed" && " Документ полностью подписан обеими сторонами."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
