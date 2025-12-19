// app/dashboard/settings/page.tsx
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const venue = await prisma.venue.findFirst({
    where: { ownerId: user.id },
    include: {
      reseller: true,
      branches: {
        include: {
          categories: {
            where: { isActive: true },
            include: { items: { where: { available: true } } },
          },
          tables: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!venue) {
    redirect("/onboarding");
  }

  if (venue.branches.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No Branch Configured</h2>
        <p className="text-gray-600">Add a branch in your venue settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-lg text-gray-600 mt-2">
          Manage your venue and branch preferences
        </p>
      </div>

      {/* Venue Info */}
      <Card>
        <CardHeader>
          <CardTitle>Venue Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Venue Name</Label>
              <Input value={venue.name} disabled className="mt-2" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input value={venue.slug} disabled className="mt-2" />
            </div>
          </div>
          <div>
            <Label>Brand</Label>
            <Input
              value={venue.reseller?.name || "Infin8Venue"}
              disabled
              className="mt-2"
            />
          </div>
          <div className="flex items-center gap-4 mt-6">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {venue.branches.length} Branch
              {venue.branches.length > 1 ? "es" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Branch Tabs */}
      <Tabs defaultValue={venue.branches[0].id} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-8">
          {venue.branches.map((branch) => (
            <TabsTrigger key={branch.id} value={branch.id}>
              {branch.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {venue.branches.map((branch) => (
          <TabsContent key={branch.id} value={branch.id} className="space-y-8">
            {/* Menu Status */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Status - {branch.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600">
                      {branch.categories.length}
                    </div>
                    <p className="text-gray-700 mt-2">Active Categories</p>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600">
                      {branch.categories.reduce(
                        (acc, cat) => acc + cat.items.length,
                        0
                      )}
                    </div>
                    <p className="text-gray-700 mt-2">Available Items</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="text-4xl font-bold text-purple-600">
                      {branch.tables.length}
                    </div>
                    <p className="text-gray-700 mt-2">Tables with QR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Table Pay</h4>
                    <p className="text-sm text-gray-600">
                      Customers can pay at table
                    </p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Offline Mode</h4>
                    <p className="text-sm text-gray-600">
                      Orders queue when offline
                    </p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="text-center text-sm text-gray-500 mt-12">
        Infin8Venue v1.0 • All features active
      </div>
    </div>
  );
}
