import { useEffect, useRef, useCallback, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuctionWebSocketMessage } from "../state/features/auction/auctionTypes";
import { API_URL } from "../settings";

interface UseAuctionWebSocketOptions {
  matchDayId: number;
  onMessage?: (message: AuctionWebSocketMessage) => void;
  enabled?: boolean;
}

export const useAuctionWebSocket = ({
  matchDayId,
  onMessage,
  enabled = true,
}: UseAuctionWebSocketOptions) => {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !matchDayId) return;

    const wsUrl = API_URL.replace(/\/api$/, "").replace(/\/$/, "") + "/ws/auction";

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/auction/${matchDayId}`, (message: IMessage) => {
          try {
            const parsed: AuctionWebSocketMessage = JSON.parse(message.body);
            onMessage?.(parsed);
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      disconnect();
    };
  }, [matchDayId, enabled, disconnect, onMessage]);

  return { connected, disconnect };
};
