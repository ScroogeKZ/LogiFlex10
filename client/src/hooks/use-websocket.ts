import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketProps {
  userId?: string;
  transactionId: string;
  onMessage: (message: any) => void;
}

export function useWebSocket({ userId, transactionId, onMessage }: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!userId || !transactionId || !isMountedRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        ws.send(JSON.stringify({
          type: "auth",
          transactionId,
        }));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        if (reconnectAttempts.current < 5 && isMountedRef.current) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              console.log(`Reconnecting... (attempt ${reconnectAttempts.current})`);
              connect();
            }
          }, delay);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
    }
  }, [userId, transactionId, onMessage]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        content,
      }));
      return true;
    }
    return false;
  }, []);

  const disconnect = useCallback(() => {
    isMountedRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    sendMessage,
  };
}
