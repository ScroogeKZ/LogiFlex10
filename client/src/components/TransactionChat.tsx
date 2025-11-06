import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Message, type User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { SendIcon, Loader2, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TransactionChatProps {
  transactionId: string;
  currentUser?: User;
  shipperId: string;
  carrierId: string;
}

export default function TransactionChat({ transactionId, currentUser, shipperId, carrierId }: TransactionChatProps) {
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", transactionId],
  });

  const { isConnected, sendMessage } = useWebSocket({
    userId: currentUser?.id,
    transactionId,
    onMessage: (data) => {
      if (data.type === "new_message") {
        queryClient.setQueryData(["/api/messages", transactionId], (old: Message[] = []) => {
          const exists = old.some(msg => msg.id === data.message.id);
          if (exists) return old;
          return [...old, data.message];
        });
      } else if (data.type === "error") {
        toast({
          title: "Ошибка",
          description: data.message,
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && isConnected) {
      setIsSending(true);
      const success = sendMessage(messageText.trim());
      if (success) {
        setMessageText("");
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить сообщение. Проверьте соединение.",
          variant: "destructive",
        });
      }
      setIsSending(false);
    }
  };

  const getInitials = (userId: string) => {
    if (userId === shipperId) return "ГО";
    if (userId === carrierId) return "ПР";
    return "U";
  };

  const getUsername = (userId: string) => {
    if (userId === shipperId) return "Грузоотправитель";
    if (userId === carrierId) return "Перевозчик";
    return "Пользователь";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Чат</CardTitle>
          {!isConnected && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <WifiOff className="w-4 h-4" />
              <span>Переподключение...</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/20" data-testid="chat-messages-container">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Нет сообщений. Начните общение!
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.senderId === currentUser?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                    data-testid={`message-${message.id}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={isCurrentUser ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                        {getInitials(message.senderId)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${isCurrentUser ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium" data-testid={`message-sender-${message.id}`}>
                          {getUsername(message.senderId)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.createdAt && format(new Date(message.createdAt), "dd MMM, HH:mm", { locale: ru })}
                        </span>
                      </div>
                      <div
                        className={`inline-block px-4 py-2 rounded-lg ${
                          isCurrentUser 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary"
                        }`}
                        data-testid={`message-content-${message.id}`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1 min-h-[60px]"
              disabled={isSending || !isConnected}
              data-testid="input-message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!messageText.trim() || isSending || !isConnected}
              className="self-end"
              data-testid="button-send-message"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <SendIcon className="w-4 h-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
