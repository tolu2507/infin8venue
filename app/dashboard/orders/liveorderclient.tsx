/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/orders/LiveOrdersClient.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, DollarSign, Loader2, MessageSquare, User } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  total: number;
  tip: number;
  notes: string;
  tableNumber: string;
  items: { quantity: number; name: string; price: number; subtotal: number }[];
  createdAt: string;
};

const statusConfig: Record<
  string,
  { color: string; next: string; label: string }
> = {
  NEW: { color: "bg-blue-600", next: "PREPARING", label: "Start Preparing" },
  PREPARING: { color: "bg-yellow-600", next: "READY", label: "Mark Ready" },
  READY: { color: "bg-green-600", next: "SERVED", label: "Mark Served" },
  SERVED: { color: "bg-purple-600", next: "CLOSED", label: "Close Order" },
};

export default function LiveOrdersClient({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const channel = supabaseBrowser
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload: any) => {
          const payloadOrder = payload.new || payload.old;

          const serialized = {
            id: payloadOrder.id,
            orderNumber: payloadOrder.order_number,
            status: payloadOrder.status,
            paymentStatus: payloadOrder.payment_status,
            subtotal: Number(payloadOrder.subtotal),
            tax: Number(payloadOrder.tax),
            total: Number(payloadOrder.total),
            tip: payloadOrder.tip ? Number(payloadOrder.tip) : 0,
            notes: payloadOrder.notes || "",
            tableNumber: payloadOrder.table_id || "Walk-in",
            items: [], // Items from initial load
            createdAt: payloadOrder.created_at,
          };

          if (payload.eventType === "INSERT") {
            setOrders((prev) => [serialized, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === serialized.id ? { ...o, ...serialized } : o
              )
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setLoading(false);
      });

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabaseBrowser.from("orders").update({ status }).eq("id", id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 text-cyan-400 animate-spin mb-4" />
        <p className="text-gray-400 text-lg">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Clock className="h-20 w-20 text-gray-500 mb-6" />
        <h2 className="text-3xl font-bold text-gray-400">No orders yet</h2>
        <p className="text-gray-500 mt-3 text-lg">
          Customer orders will appear here in real-time
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl lg:text-3xl font-bold mb-10 text-cyan-400 text-left">
        Live Orders ({orders.length})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {orders.map((order) => {
          const config = statusConfig[order.status] || {
            color: "bg-gray-600",
            next: "",
            label: "",
          };

          return (
            <Card
              key={order.id}
              className="border border-gray-800 hover:border-cyan-500 transition-all duration-300 shadow-sm bg-gray-900/90 backdrop-blur-xs">
              <CardHeader className="pb-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-6 w-6 text-cyan-400" />
                      <CardTitle className="text-2xl">
                        {order.tableNumber}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-white">
                      #{order.orderNumber}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge
                      className={`${config.color} text-white text-base px-2 py-1`}>
                      {order.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className="block text-xs">
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {order.items.length === 0 ? (
                    <p className="text-white text-center py-4">No items</p>
                  ) : (
                    order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2 border-b text-white border-gray-800 last:border-0">
                        <span className="text-base">
                          <strong>{item.quantity}×</strong> {item.name}
                        </span>
                        <span className="text-gray-300">
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {order.notes && (
                  <div className="bg-gray-800/70 rounded-xl p-4 flex gap-4">
                    <MessageSquare className="h-6 w-6 text-cyan-400 shrink-0 mt-1" />
                    <p className="text-base text-gray-200 leading-relaxed">
                      {order.notes}
                    </p>
                  </div>
                )}

                <Separator className="bg-gray-700" />

                <div className="space-y-3 text-lg">
                  <div className="flex text-white justify-between">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex text-white justify-between">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  {order.tip > 0 && (
                    <div className="flex justify-between text-cyan-300">
                      <span>Tip</span>
                      <span>${order.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-bold text-cyan-400 pt-3 border-t border-gray-700">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-7 w-7" />
                      Total
                    </span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {config.next && (
                  <Button
                    onClick={() => updateStatus(order.id, config.next)}
                    size="lg"
                    className="w-full text-lg py-6 font-semibold bg-cyan-600 hover:bg-cyan-500">
                    {config.label}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
