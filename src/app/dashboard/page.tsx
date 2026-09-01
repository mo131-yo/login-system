import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Хяналтын самбар</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Тавтай морил, {session.user?.name}
      </p>
      <div className="mt-6 rounded-md border border-black/10 p-4 text-sm dark:border-white/10">
        <p>Имэйл: {session.user?.email}</p>
        <p>Хэрэглэгчийн ID: {session.user?.id}</p>
      </div>
    </div>
  );
}
