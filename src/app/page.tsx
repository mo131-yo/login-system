import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="text-3xl font-semibold">Login &amp; Signup систем</h1>
      <p className="text-black/60 dark:text-white/60">
        Имэйл + нууц үг, эсвэл Google акаунтаар нэвтрэх боломжтой.
      </p>
      {session ? (
        <Link href="/dashboard" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
          Хяналтын самбар руу орох
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link href="/login" className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20">
            Нэвтрэх
          </Link>
          <Link href="/signup" className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            Бүртгүүлэх
          </Link>
        </div>
      )}
    </div>
  );
}
