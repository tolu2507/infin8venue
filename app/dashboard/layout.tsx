// app/dashboard/layout.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const navItems = [
  { name: "Menu", href: "/dashboard/menu" },
  { name: "Tables", href: "/dashboard/tables" },
  { name: "Live Orders", href: "/dashboard/orders" },
  { name: "Settings", href: "/dashboard/settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Use maybeSingle() to safely check if venue exists
  const { data: venue, error } = await supabase
    .from("venues")
    .select("id")
    .eq("ownerId", user.id);
  //  .single()
  console.log(venue);
  // If no venue, go to onboarding
  if (error) {
    console.log({ error });
  }
  if (!venue) {
    redirect("/onboarding");
  }

  // Venue exists — show dashboard
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Infin8Venue</h1>
          <p className="text-sm text-gray-600">Venue Admin</p>
        </div>
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-none h-12 text-left">
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <Card className="p-8 min-h-[calc(100vh-4rem)]">{children}</Card>
      </main>
    </div>
  );
}
