// app/onboarding/OnboardingClient.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { redirect } from "next/navigation";

export default function OnboardingClient({ userEmail }: { userEmail: string }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const name = formData.get("name") as string;
    const branchName = (formData.get("branchName") as string) || "Main Branch"; // Optional

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!slug) {
      toast.error("Please enter a valid restaurant name");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/onboarding/venue", {
      method: "POST",
      body: JSON.stringify({ name, slug, branchName }), // Send branchName
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Restaurant created successfully!");
      redirect("/dashboard");
    } else {
      toast.error(data.error || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-10 shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-4">Welcome!</h1>
        <p className="text-center text-gray-600 mb-2">
          Let&apos;s set up your restaurant
        </p>
        <p className="text-center text-sm text-gray-500 mb-8">
          Signed in as: {userEmail}
        </p>

        <form action={handleSubmit} className="space-y-8">
          <div>
            <Label htmlFor="name" className="text-lg">
              Restaurant Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Sunset Beach Cafe"
              required
              className="mt-3 text-lg h-12"
            />
            <p className="text-sm text-gray-500 mt-3">
              Your menu will be at:{" "}
              <strong>yourapp.com/[name-in-kebab-case]</strong>
            </p>
          </div>

          <div>
            <Label htmlFor="branchName" className="text-lg">
              Branch Name (optional)
            </Label>
            <Input
              id="branchName"
              name="branchName"
              placeholder="e.g., Rooftop, Indoor, Main Branch"
              className="mt-3 text-lg h-12"
            />
            <p className="text-sm text-gray-500 mt-3">
              Default: &ldquo;Main Branch&ldquo;
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full py-8 text-xl font-semibold"
            disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Creating Your Restaurant...
              </>
            ) : (
              "Create My Restaurant"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
