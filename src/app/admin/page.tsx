import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Тавтай морил, {session.user.name} (admin)
      </p>
      <div className="mt-6 rounded-md border border-black/10 p-4 text-sm dark:border-white/10">
        <p>Энэ хуудас зөвхөн <code>role = &quot;admin&quot;</code> хэрэглэгчид нээлттэй.</p>
      </div>
    </div>
  );
}
