import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { getCurrentUserSafely } from "@/lib/auth";
import { LanguageSelector } from "@/components/ui/language-selector";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (await getCurrentUserSafely()) redirect("/");
  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute right-4 top-4"><LanguageSelector /></div>
      <form action={loginAction} className="glass w-full max-w-sm space-y-5 rounded-2xl p-7">
        <div className="flex items-center gap-3">
          <Image src="/icon-192.png" alt="" width={48} height={48} className="rounded-xl" priority />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">AP Football</p>
            <h1 className="text-xl font-semibold">Goals Conceded</h1>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Access the private workspace assigned to your account.</p>
        </div>
        {searchParams.error === "database" && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            The database is temporarily unavailable. Check the local configuration and try again.
          </p>
        )}
        {searchParams.error && searchParams.error !== "database" && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            The username or password is incorrect.
          </p>
        )}
        <label className="block space-y-1.5 text-sm">
          <span>Username</span>
          <input name="username" autoComplete="username" maxLength={80} required autoFocus className="h-11 w-full rounded-lg border border-input bg-background/80 px-3" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" maxLength={256} required className="h-11 w-full rounded-lg border border-input bg-background/80 px-3" />
        </label>
        <button className="h-11 w-full rounded-lg bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90">Sign in</button>
        <p className="text-center text-sm text-muted-foreground">
          No account yet? <Link href="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">Create one</Link>
        </p>
      </form>
    </main>
  );
}
