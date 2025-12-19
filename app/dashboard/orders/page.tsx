/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LiveOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel("orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Order" },
        (payload: any) => {
          setOrders((prev) => {
            const filtered = prev.filter((o) => o.id !== payload.new.id);
            return payload.eventType === "DELETE"
              ? filtered
              : [...filtered, payload.new];
          });
        }
      )
      .subscribe();

    supabaseBrowser
      .from("Order")
      .select("*")
      .then(({ data }) => setOrders(data || []));

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await supabaseBrowser.from("Order").update({ status }).eq("id", id);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Live Orders</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {["NEW", "PREPARING", "READY"].map((status) => (
          <div key={status} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">{status}</h2>
            {orders
              .filter((o) => o.status === status)
              .map((order) => (
                <div key={order.id} className="bg-gray-50 p-4 rounded mb-4">
                  <p className="font-semibold">Table {order.tableId}</p>
                  <p>Total: ${order.total}</p>
                  <Button
                    onClick={() =>
                      updateStatus(
                        order.id,
                        status === "NEW" ? "PREPARING" : "READY"
                      )
                    }
                    className="mt-2">
                    → {status === "NEW" ? "Start Preparing" : "Mark Ready"}
                  </Button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
