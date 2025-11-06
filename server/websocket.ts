import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { storage } from "./storage";
import { parse } from "cookie";
import { unsign } from "cookie-signature";
import type { IncomingMessage } from "http";

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
  userId?: string;
  transactionId?: string;
  isAuthenticated: boolean;
}

async function getUserIdFromSession(req: IncomingMessage): Promise<string | null> {
  try {
    const cookies = parse(req.headers.cookie || "");
    const signedSessionId = cookies["connect.sid"];
    
    if (!signedSessionId) {
      return null;
    }

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      console.error("SESSION_SECRET is not defined");
      return null;
    }

    let sessionId: string;
    
    if (signedSessionId.startsWith("s:")) {
      const unsignedResult = unsign(signedSessionId.slice(2), sessionSecret);
      if (unsignedResult === false) {
        console.error("Failed to unsign session ID");
        return null;
      }
      sessionId = unsignedResult;
    } else {
      sessionId = signedSessionId;
    }

    const session = await storage.getSession(sessionId);
    
    if (!session || !session.passport?.user?.claims?.sub) {
      return null;
    }
    
    return session.passport.user.claims.sub;
  } catch (error) {
    console.error("Error extracting user from session:", error);
    return null;
  }
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws",
    verifyClient: async (info, callback) => {
      try {
        const userId = await getUserIdFromSession(info.req);
        if (!userId) {
          callback(false, 401, "Unauthorized");
          return;
        }
        (info.req as any).userId = userId;
        callback(true);
      } catch (error) {
        console.error("WebSocket verification error:", error);
        callback(false, 500, "Internal Server Error");
      }
    }
  });

  wss.on("connection", (ws: WebSocketClient, req: any) => {
    console.log("WebSocket client connected");
    ws.isAlive = true;
    ws.isAuthenticated = false;
    ws.userId = req.userId;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "auth":
            if (!ws.userId) {
              ws.send(JSON.stringify({ 
                type: "error", 
                message: "Not authenticated" 
              }));
              ws.close();
              return;
            }

            const transaction = await storage.getTransaction(message.transactionId);
            if (!transaction || 
                (transaction.shipperId !== ws.userId && transaction.carrierId !== ws.userId)) {
              ws.send(JSON.stringify({ 
                type: "error", 
                message: "Not authorized to access this transaction" 
              }));
              ws.close();
              return;
            }

            ws.transactionId = message.transactionId;
            ws.isAuthenticated = true;
            console.log(`User ${ws.userId} authenticated for transaction ${ws.transactionId}`);
            
            ws.send(JSON.stringify({
              type: "authenticated",
              userId: ws.userId,
              transactionId: ws.transactionId
            }));
            break;

          case "message":
            if (!ws.isAuthenticated || !ws.userId || !ws.transactionId) {
              ws.send(JSON.stringify({ 
                type: "error", 
                message: "Not authenticated. Please send auth message first." 
              }));
              return;
            }

            const newMessage = await storage.createMessage(ws.userId, {
              transactionId: ws.transactionId,
              content: message.content,
            });

            wss.clients.forEach((client: WebSocket) => {
              const wsClient = client as WebSocketClient;
              if (client.readyState === WebSocket.OPEN && 
                  wsClient.isAuthenticated &&
                  wsClient.transactionId === ws.transactionId) {
                client.send(JSON.stringify({
                  type: "new_message",
                  message: newMessage,
                }));
              }
            });
            break;

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("WebSocket error:", error);
        ws.send(JSON.stringify({ 
          type: "error", 
          message: "Invalid message format" 
        }));
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as WebSocketClient;
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  console.log("WebSocket server initialized on /ws");
  
  return wss;
}
