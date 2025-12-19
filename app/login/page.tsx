/* eslint-disable @typescript-eslint/no-explicit-any */
// app/login/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";

export default function LoginPage() {
  // app/login/page.tsx (updated server action)
  const signInOrSignUp: any = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = await createSupabaseServerClient();

    // Try sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("this is the data of signin user => ", data);

    // If sign in fails, sign up
    if (error || !data.session) {
      console.log(error);
      console.log(data);
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
          },
        });
      console.log(signUpData);
      if (signUpError) {
        console.error("Signup error:", signUpError);
        return { error: signUpError.message };
      }

      // data = signUpData;
    }

    // Force refresh the session cookie
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // This forces the cookie to be set in the response headers
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }

    redirect("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-3xl font-bold mb-8 text-center">Venue Login</h1>
        <form action={signInOrSignUp} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@demo.com"
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="any password"
              required
              className="mt-2"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Continue to Dashboard
          </Button>
        </form>
        <p className="text-sm text-gray-600 mt-6 text-center">
          First time? We&apos;ll create your account automatically.
          <br />
          Any email + password works in development.
        </p>
      </div>
    </div>
  );
}
