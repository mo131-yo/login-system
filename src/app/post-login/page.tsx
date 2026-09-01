import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PostLoginPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }
  if (session.user.role === "admin") {
    redirect("/admin");
  }
  redirect("/dashboard");
}
