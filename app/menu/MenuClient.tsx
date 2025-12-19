/* eslint-disable @typescript-eslint/no-explicit-any */
// app/menu/MenuClient.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShoppingCart, Plus, CreditCard, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export default function MenuClient({ branch, context, openOrder }: any) {
  const [cart, setCart] = useState<any[]>([]);
  const [openCart, setOpenCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [openBill, setOpenBill] = useState(false);
  const [tipPercent, setTipPercent] = useState<any>(15);
  const [customTip, setCustomTip] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | null>(
    null
  );

  const venueName = branch.venue?.name || "Restaurant";
  const tableNumber = context.tableId || "Table";

  // Use open order items if exists, else local cart
  const currentItems = openOrder ? openOrder.items : cart;
  const subtotal = currentItems.reduce(
    (sum: number, i: any) => sum + i.price * i.qty,
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const tip =
    tipPercent === "custom"
      ? Number(customTip || 0)
      : subtotal * (tipPercent / 100);
  const total = subtotal + tax + tip;

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success("Added to cart", {
      description: (item.name as any).en,
    });
    setOpenCart(true);
  };

  const placeOrder = async () => {
    if (currentItems.length === 0) {
      toast.error("No items in order");
      return;
    }

    const orderData = {
      branch_id: context.branchId,
      table_id: context.tableId,
      subtotal,
      tax,
      total,
      items: currentItems.map((i: any) => ({
        menu_item_id: i.id,
        quantity: i.qty,
        price_at_order: Number(i.price),
      })),
    };

    const { error } = await supabaseBrowser
      .from("orders")
      .upsert(orderData, { onConflict: "branch_id,table_id" });

    if (error) {
      toast.error("Failed to place order");
      console.log(error);
    } else {
      toast.success("Order placed successfully!");
      setCart([]);
      window.location.reload();
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === "cash") {
      toast.success("Please go to the cashier with your bill", {
        description: `Table ${tableNumber} - Total $${total.toFixed(2)}`,
        duration: 15000,
      });
      setOpenBill(false);
      // Optionally close order here
      return;
    }

    if (paymentMethod === "card") {
      const res = await fetch("/api/payment/stripe", {
        method: "POST",
        body: JSON.stringify({
          amount: total,
          tableNumber,
          venueName,
          orderId: openOrder?.id || "new",
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        toast.error("Payment failed");
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b border-cyan-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-cyan-400">
              {venueName}
            </h1>
            <p className="text-cyan-300 text-sm">Table {tableNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            {(openOrder || cart.length > 0) && (
              <Button
                onClick={() => setOpenBill(true)}
                className="bg-orange-600 hover:bg-orange-500 text-sm">
                Close Table & Pay
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setOpenCart(true)}
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30 text-sm">
              <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Cart ({currentItems.length})
              {subtotal > 0 && (
                <span className="ml-2 text-cyan-300 text-sm">
                  ${subtotal.toFixed(2)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Menu List */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {branch.categories.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-lg sm:text-xl text-cyan-400">Menu loading...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {branch.categories.map((cat: any) => (
              <section key={cat.id}>
                <h2 className="text-xl sm:text-2xl font-semibold text-cyan-400 mb-5">
                  {(cat.name as any).en}
                </h2>

                <div className="space-y-3">
                  {cat.items.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex items-center gap-4 hover:border-cyan-600 hover:bg-gray-900/60 transition-all cursor-pointer">
                      {item.imageUrl ? (
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-md overflow-hidden">
                          <Image
                            src={item.imageUrl}
                            alt={(item.name as any).en}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-800 rounded-md flex items-center justify-center shrink-0">
                          <span className="text-cyan-400 text-base sm:text-lg font-medium">
                            {(item.name as any).en.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-white truncate">
                          {(item.name as any).en}
                        </h3>
                        <p className="text-lg sm:text-xl font-bold text-cyan-400">
                          ${Number(item.price).toFixed(2)}
                        </p>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-gray-900 border-cyan-600 text-white w-full max-w-lg mx-4 sm:mx-auto rounded-lg">
          {selectedItem && (
            <>
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-cyan-400">
                  {(selectedItem.name as any).en}
                </DialogTitle>
              </DialogHeader>

              {selectedItem.imageUrl ? (
                <div className="relative w-full h-64 sm:h-72 rounded-lg overflow-hidden my-4">
                  <Image
                    src={selectedItem.imageUrl}
                    alt={(selectedItem.name as any).en}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-64 sm:h-72 bg-gray-800 rounded-lg my-4 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-cyan-400">
                    {(selectedItem.name as any).en.charAt(0)}
                  </span>
                </div>
              )}

              <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed px-4 text-center">
                {(selectedItem.description as any)?.en ||
                  "Freshly prepared with care"}
              </p>

              <div className="flex justify-center mb-6">
                <p className="text-2xl sm:text-3xl font-bold text-cyan-400">
                  ${Number(selectedItem.price).toFixed(2)}
                </p>
              </div>

              <Button
                onClick={() => {
                  addToCart(selectedItem);
                  setSelectedItem(null);
                }}
                size="lg"
                className="w-full mx-4 mb-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-5 text-base sm:text-lg">
                <Plus className="mr-3 h-5 w-5" />
                Add to Cart
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      <Sheet open={openCart} onOpenChange={setOpenCart}>
        <SheetContent className="bg-black border-l border-cyan-800 w-full sm:max-w-md">
          <SheetHeader className="border-b border-cyan-800 pb-6 mb-6">
            <SheetTitle className="text-xl sm:text-2xl font-bold text-cyan-400">
              Your Order
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 px-4">
            {currentItems.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-cyan-500/30 mx-auto mb-5" />
                <p className="text-lg sm:text-xl text-gray-400">
                  Your cart is empty
                </p>
              </div>
            ) : (
              <>
                {currentItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-4 border-b border-gray-800">
                    <div>
                      <p className="font-medium text-base sm:text-lg text-cyan-300">
                        {(item.name as any).en}
                      </p>
                      <p className="text-gray-400 text-sm">× {item.qty}</p>
                    </div>
                    <p className="font-bold text-base sm:text-lg text-cyan-400">
                      ${(Number(item.price) * item.qty).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="border-t-2 border-cyan-800 pt-8 mt-8">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-xl sm:text-2xl text-white font-bold">
                      Total
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold text-cyan-400">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={placeOrder}
                    size="lg"
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-6 text-base sm:text-lg">
                    Place Order
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Bill & Payment Modal */}
      <Dialog open={openBill} onOpenChange={setOpenBill}>
        <DialogContent className="bg-gray-900 border-cyan-600 text-white w-full max-w-lg mx-4 sm:mx-auto rounded-lg">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-cyan-400">
              Your Final Bill
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-3 text-lg">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="bg-gray-700" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total with Tip</span>
                <span className="text-cyan-400">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Tip Selector */}
            <div>
              <p className="text-center mb-4 text-sm sm:text-base">Add Tip</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 15, 20].map((p) => (
                  <Button
                    key={p}
                    variant={tipPercent === p ? "outline" : "outline"}
                    onClick={() => {
                      setTipPercent(p);
                      setCustomTip("");
                    }}
                    className="text-sm">
                    {p}%
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom tip amount"
                value={customTip}
                onChange={(e) => {
                  setTipPercent("custom");
                  setCustomTip(e.target.value);
                }}
                className="mt-4 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-center mb-4 text-sm sm:text-base">
                Payment Method
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setPaymentMethod("card")}
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className="py-6 text-sm sm:text-base">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Card
                </Button>
                <Button
                  onClick={() => setPaymentMethod("cash")}
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className="py-6 text-sm sm:text-base">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Cash
                </Button>
              </div>
            </div>

            {/* Final Button */}
            {paymentMethod && (
              <Button
                onClick={handlePayment}
                size="lg"
                className="w-full bg-cyan-600 hover:bg-cyan-500 py-6 text-base sm:text-lg font-bold">
                {paymentMethod === "cash"
                  ? "Confirm Cash Payment"
                  : "Pay with Card"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
