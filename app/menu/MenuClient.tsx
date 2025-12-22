/* eslint-disable @typescript-eslint/no-explicit-any */
// app/menu/MenuClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  DollarSign,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cuid, generateOrderNumber } from "@/lib/utils";

export default function MenuClient({ branch, context, openOrder }: any) {
  const [cart, setCart] = useState<any[]>([]);
  const [openCart, setOpenCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<any>({});
  const [openBill, setOpenBill] = useState(false);
  const [tipPercent, setTipPercent] = useState<any>(15);
  const [customTip, setCustomTip] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | null>(
    null
  );
  const [notes, setNotes] = useState("");

  const venueName = branch.venue?.name || "Restaurant";
  const tableNumber = context.tableId || "Table";

  useEffect(() => {
    if (openOrder && openOrder.items) {
      setCart(openOrder.items);
    }
  }, [openOrder]);

  const currentItems = cart;
  const subtotal = currentItems.reduce(
    (sum: number, i: any) => sum + i.price * i.qty,
    0
  );
  const tax = subtotal * 0.1;
  const tip =
    tipPercent === "custom"
      ? Number(customTip || 0)
      : subtotal * (tipPercent / 100);
  const total = subtotal + tax + tip;

  const addToCart = (item: any, selectedMods: any = {}) => {
    const itemWithMods = {
      ...item,
      qty: 1,
      selectedModifiers: selectedMods,
    };

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i:any) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, itemWithMods];
    });
    toast.success("Added to cart", {
      description: (item.name as any).en,
    });
    setOpenCart(true);
    setSelectedItem(null);
    setSelectedModifiers({});
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((i:any) => i.id === id);
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        return prev.filter((i:any) => i.id !== id);
      }
      return prev.map((i:any) => (i.id === id ? { ...i, qty: newQty } : i));
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i:any) => i.id !== id));
    toast.info("Item removed");
  };

  const placeOrder = async () => {
    if (currentItems.length === 0) {
      toast.error("No items in order");
      return;
    }

    try {
      const newOrderId = cuid();
      const orderNumber = generateOrderNumber();
      const idempotencyKey = crypto.randomUUID();
      const now = new Date().toISOString();

      const orderData = {
        id: newOrderId,
        branch_id: context.branchId,
        table_id: context.tableId,
        order_number: orderNumber,
        idempotency_key: idempotencyKey,
        subtotal,
        tax,
        total,
        tip: tip || null,
        notes: notes.trim() || null,
        status: "NEW",
        payment_status: "PENDING",
        created_at: now,
        updated_at: now,
      };

      const { error: orderError } = await supabaseBrowser
        .from("orders")
        .insert(orderData);

      if (orderError) throw orderError;

      const orderItemsData = currentItems.map((i: any) => ({
        id: cuid(),
        order_id: newOrderId,
        menu_item_id: i.id,
        quantity: i.qty,
        price_at_order: Number(i.price),
        item_name: (i.name as any).en,
        subtotal: Number(i.price) * i.qty,
        modifiers_selected: i.selectedModifiers || null,
      }));

      const { error: itemsError } = await supabaseBrowser
        .from("order_items")
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      toast.success("Order placed successfully!");
      setCart([]);
      setNotes("");
      window.location.reload();
    } catch (error: any) {
      toast.error("Failed to place order");
      console.error(error);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === "cash") {
      toast.success("Please go to the cashier with your bill", {
        description: `Table ${tableNumber} - Total $${total.toFixed(2)}`,
        duration: 15000,
      });
      setOpenBill(false);
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

  const handleModifierChange = (
    modIndex: number,
    option: string,
    checked: boolean
  ) => {
    setSelectedModifiers((prev: any) => {
      const newMods = { ...prev };
      if (!newMods[modIndex]) newMods[modIndex] = [];
      if (checked) {
        newMods[modIndex].push(option);
      } else {
        newMods[modIndex] = newMods[modIndex].filter(
          (o: string) => o !== option
        );
      }
      return newMods;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b border-cyan-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-cyan-400">{venueName}</h1>
            <p className="text-cyan-300 text-xs">Table {tableNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {(openOrder || cart.length > 0) && (
              <Button
                onClick={() => setOpenBill(true)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-500 text-xs">
                Close & Pay
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setOpenCart(true)}
              size="sm"
              className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30 text-xs">
              <ShoppingCart className="mr-1 h-4 w-4" />
              Cart ({currentItems.length})
              {subtotal > 0 && (
                <span className="ml-1 text-cyan-300 text-xs">
                  ${subtotal.toFixed(2)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Menu List */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {branch.categories.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-base text-cyan-400">Menu loading...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {branch.categories.map((cat: any) => (
              <section key={cat.id}>
                <h2 className="text-lg font-semibold text-cyan-400 mb-4">
                  {(cat.name as any).en}
                </h2>

                <div className="space-y-2">
                  {cat.items.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex items-center gap-3 hover:border-cyan-600 hover:bg-gray-900/60 transition-all cursor-pointer">
                      {item.imageUrl ? (
                        <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden">
                          <Image
                            src={item.imageUrl}
                            alt={(item.name as any).en}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center shrink-0">
                          <span className="text-cyan-400 text-sm font-medium">
                            {(item.name as any).en.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {(item.name as any).en}
                        </h3>
                        <p className="text-base font-bold text-cyan-400">
                          ${Number(item.price).toFixed(2)}
                        </p>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item, {});
                        }}
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Item Detail Modal with Modifiers */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={() => {
          setSelectedItem(null);
          setSelectedModifiers({});
        }}>
        <DialogContent className="bg-gray-900 border-cyan-600 text-white w-full max-w-sm mx-auto rounded-lg">
          {selectedItem && (
            <>
              <DialogHeader className="text-center pb-3">
                <DialogTitle className="text-lg font-bold text-cyan-400">
                  {(selectedItem.name as any).en}
                </DialogTitle>
              </DialogHeader>

              {selectedItem.imageUrl ? (
                <div className="relative w-full h-56 rounded-lg overflow-hidden my-3">
                  <Image
                    src={selectedItem.imageUrl}
                    alt={(selectedItem.name as any).en}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-56 bg-gray-800 rounded-lg my-3 flex items-center justify-center">
                  <span className="text-4xl font-bold text-cyan-400">
                    {(selectedItem.name as any).en.charAt(0)}
                  </span>
                </div>
              )}

              <p className="text-xs text-gray-300 mb-5 leading-relaxed px-3 text-center">
                {(selectedItem.description as any)?.en ||
                  "Freshly prepared with care"}
              </p>

              <div className="flex justify-center mb-5">
                <p className="text-xl font-bold text-cyan-400">
                  ${Number(selectedItem.price).toFixed(2)}
                </p>
              </div>

              {/* Modifiers Selection */}
              {selectedItem.modifiers && selectedItem.modifiers.length > 0 && (
                <div className="space-y-5 border-t border-gray-700 pt-5">
                  <p className="text-center text-sm text-gray-400">
                    Customize your order
                  </p>
                  {selectedItem.modifiers.map((mod: any, modIndex: number) => (
                    <div key={modIndex}>
                      <p className="font-medium text-sm mb-3">{mod.name.en}</p>
                      <div className="space-y-2">
                        {mod.options.map((option: string) => (
                          <label
                            key={option}
                            className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                              checked={
                                selectedModifiers[modIndex]?.includes(option) ||
                                false
                              }
                              onCheckedChange={(checked) =>
                                handleModifierChange(
                                  modIndex,
                                  option,
                                  checked as boolean
                                )
                              }
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => {
                  const modsArray = Object.values(selectedModifiers).flat();
                  addToCart(selectedItem, modsArray);
                }}
                size="lg"
                className="w-full mx-3 mb-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 text-sm mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      <Sheet open={openCart} onOpenChange={setOpenCart}>
        <SheetContent className="bg-black border-l border-cyan-800 w-full sm:max-w-md">
          <SheetHeader className="border-b border-cyan-800 pb-5 mb-5 flex items-center justify-between">
            <SheetTitle className="text-lg font-bold text-cyan-400">
              Your Order
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenCart(false)}
              className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          </SheetHeader>

          <div className="space-y-4 px-3">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="h-12 w-12 text-cyan-500/30 mx-auto mb-4" />
                <p className="text-base text-gray-400">Your cart is empty</p>
              </div>
            ) : (
              <>
                {cart.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-3 border-b border-gray-800">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-cyan-300">
                        {(item.name as any).en}
                      </p>
                      {item.selectedModifiers &&
                        item.selectedModifiers.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {item.selectedModifiers.join(", ")}
                          </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateQty(item.id, -1)}
                        className="h-7 w-7 p-0 text-white hover:bg-gray-700">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-bold w-8 text-center">
                        {item.qty}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateQty(item.id, 1)}
                        className="h-7 w-7 p-0 text-white hover:bg-gray-700">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <p className="text-sm font-bold text-cyan-400 w-20 text-right">
                      ${(Number(item.price) * item.qty).toFixed(2)}
                    </p>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="mt-6">
                  <Label className="text-sm text-gray-400">
                    Special Instructions (optional)
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., No onions, extra spicy"
                    className="mt-2 bg-gray-800 border-gray-700 text-white text-sm"
                  />
                </div>

                <div className="border-t-2 border-cyan-800 pt-6 mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg text-white font-bold">Total</span>
                    <span className="text-xl font-bold text-cyan-400">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={placeOrder}
                    size="lg"
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-5 text-sm">
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
        <DialogContent className="bg-gray-900 border-cyan-600 text-white w-full max-w-sm mx-auto rounded-lg">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold text-cyan-400">
              Your Final Bill
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-5">
            <div className="space-y-2 text-base">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="bg-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total with Tip</span>
                <span className="text-cyan-400">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Tip */}
            <div>
              <p className="text-center mb-3 text-sm">Add Tip</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 15, 20].map((p:number) => (
                  <Button
                    key={p}
                    variant={tipPercent === p ? "default" : "outline"}
                    onClick={() => {
                      setTipPercent(p);
                      setCustomTip("");
                    }}
                    size="sm"
                    className="text-xs">
                    {p}%
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom"
                value={customTip}
                onChange={(e) => {
                  setTipPercent("custom");
                  setCustomTip(e.target.value);
                }}
                className="mt-3 bg-gray-800 border-gray-700 text-white text-sm"
              />
            </div>

            {/* Payment */}
            <div>
              <p className="text-center mb-3 text-sm">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setPaymentMethod("card")}
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className="py-4 text-xs">
                  <CreditCard className="mr-1 h-4 w-4" />
                  Card
                </Button>
                <Button
                  onClick={() => setPaymentMethod("cash")}
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className="py-4 text-xs">
                  <DollarSign className="mr-1 h-4 w-4" />
                  Cash
                </Button>
              </div>
            </div>

            {paymentMethod && (
              <Button
                onClick={handlePayment}
                size="lg"
                className="w-full bg-cyan-600 hover:bg-cyan-500 py-5 text-sm font-bold">
                {paymentMethod === "cash" ? "Confirm Cash" : "Pay with Card"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
