/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/tables/tablesclient.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Package, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function TablesClient({
  tables,
  branchId,
}: {
  tables: any[];
  branchId: string;
}) {
  const [openAdd, setOpenAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<{
    url: string;
    dataUrl: string;
    tableNumber: string;
  } | null>(null);

  const addTable = async (formData: FormData) => {
    setLoading(true);
    const number = formData.get("number") as string;
    const area = (formData.get("area") as string) || null;

    const res = await fetch("/api/tables", {
      method: "POST",
      body: JSON.stringify({ branchId, number, area }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success("Table added!");
      setOpenAdd(false);
      window.location.reload();
    } else {
      toast.error("Failed to add table");
    }
    setLoading(false);
  };

  const generateQR = async (tableId: string, tableNumber: string) => {
    const res = await fetch("/api/qr/generate", {
      method: "POST",
      body: JSON.stringify({ tableId }),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      toast.error("Failed to generate QR code");
      return;
    }

    const data = await res.json();
    setQrData({
      url: data.url,
      dataUrl: data.dataUrl,
      tableNumber,
    });
    setQrOpen(true);
  };

  return (
    <>
      {/* Add Table Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Tables & QR Codes</h1>
          <p className="text-lg text-gray-600 mt-2">
            Generate and view QR codes for each table
          </p>
        </div>

        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <form action={addTable} className="space-y-4">
              <div>
                <Label>Table Number</Label>
                <Input
                  name="number"
                  placeholder="e.g., Table 5"
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Area (optional)</Label>
                <Input
                  name="area"
                  placeholder="e.g., Terrace"
                  className="mt-2"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Table"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tables Grid or Empty State */}
      {tables.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <Package className="h-16 w-16 text-gray-400 mx-auto" />
            <h2 className="text-2xl font-semibold">No tables yet</h2>
            <p className="text-gray-600">
              Add your first table to start generating QR codes
            </p>
            <Button onClick={() => setOpenAdd(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add First Table
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tables.map((table:any) => (
            <Card key={table.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">{table.number}</CardTitle>
                  <Badge variant="secondary">v{table.qrVersion}</Badge>
                </div>
                <p className="text-gray-600">{table.area || "Main Area"}</p>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full mb-4"
                  onClick={() => generateQR(table.id, table.number)}>
                  Generate QR Code
                </Button>
                <div className="bg-gray-100 border-2 border-dashed rounded-xl w-full h-64 flex items-center justify-center">
                  <p className="text-gray-500 text-center">
                    Click &quot;Generate QR Code&quot;
                    <br />
                    Modal will show QR
                  </p>
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  QR codes are signed and secure
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Clean QR Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              QR Code for {qrData?.tableNumber}
            </DialogTitle>
          </DialogHeader>
          {qrData && (
            <div className="space-y-8 py-6">
              {/* Link + Open Button */}
              <div className="flex items-center justify-center gap-4 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  This is your menu link —{" "}
                  <a
                    href={qrData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium underline">
                    click to view
                  </a>
                </p>
                <Button size="sm" asChild>
                  <a
                    href={qrData.url}
                    target="_blank"
                    rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>

              {/* QR Image */}
              <div className="flex justify-center">
                <Image
                  src={qrData.dataUrl}
                  alt={`QR for ${qrData.tableNumber}`}
                  width={380}
                  height={380}
                  className="rounded-lg shadow-xl"
                />
              </div>

              {/* Download */}
              <Button
                className="w-full"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = qrData.dataUrl;
                  link.download = `QR-${qrData.tableNumber.replace(
                    /\s+/g,
                    "-"
                  )}.png`;
                  link.click();
                }}>
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* How to Use */}
      <div className="bg-blue-50 p-6 rounded-lg mt-12">
        <h2 className="text-xl font-semibold mb-2">How to Use</h2>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Click &quot;Generate QR Code&quot; for a table</li>
          <li>A modal will appear with the QR code and menu URL</li>
          <li>
            Click &quot;Open&quot; to test the menu or &quot;Download Image&quot; to save the QR
          </li>
          <li>Print the downloaded image and place on tables</li>
          <li>Customers scan → go directly to menu</li>
        </ol>
      </div>
    </>
  );
}
