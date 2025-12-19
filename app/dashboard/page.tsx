// app/dashboard/page.tsx
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, TableIcon, ShoppingCart, Settings } from "lucide-react";

export default async function DashboardHome() {
  const [menuItemCount, tableCount, orderCount] = await Promise.all([
    prisma.menuItem.count(),
    prisma.table.count(),
    prisma.order.count(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-lg text-gray-600 mt-2">
          Manage your venue, menu, tables, and live orders.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Menu Items
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{menuItemCount}</div>
            <p className="text-xs text-gray-500 mt-1">Active on menu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tables
            </CardTitle>
            <TableIcon className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tableCount}</div>
            <p className="text-xs text-gray-500 mt-1">With QR codes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orderCount}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Quick Actions
            </CardTitle>
            <Settings className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full">
                Venue Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/menu">
            <CardHeader>
              <CardTitle>Manage Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Add, edit, or organize categories and items
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/tables">
            <CardHeader>
              <CardTitle>Tables & QRs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Generate and print QR codes for tables
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/orders">
            <CardHeader>
              <CardTitle>Live Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Real-time kitchen display system</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
