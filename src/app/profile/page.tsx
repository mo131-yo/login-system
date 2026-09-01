import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { sql, type User } from "@/lib/db";
import { ProfileShell } from "@/components/profile/profile-shell";
import { ProfileNameRow } from "@/components/profile/profile-name-row";
import { ProfilePhoneRow } from "@/components/profile/profile-phone-row";
import { GoogleConnectionRow } from "@/components/profile/google-connection-row";
import { PasswordRow } from "@/components/profile/password-row";
import { DangerZoneRow } from "@/components/profile/danger-zone-row";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) {
    redirect("/login?callbackUrl=/profile");
  }

  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${Number(session.user.id)}`;
  if (!user) {
    redirect("/login");
  }

  const hasPassword = !!user.password_hash;

  return (
    <ProfileShell
      profileContent={
        <>
          <ProfileNameRow initialName={user.name} avatarSrc={session.user.image} />
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div className="w-24 shrink-0 text-sm text-gray-500 dark:text-gray-400">Имэйл</div>
            <div className="flex-1 text-sm text-gray-900 dark:text-white">{user.email}</div>
          </div>
          <ProfilePhoneRow initialPhone={user.phone ?? ""} />
          <GoogleConnectionRow isLinked={!!user.google_id} hasPassword={hasPassword} email={user.email} />
        </>
      }
      securityContent={
        <>
          <PasswordRow hasPassword={hasPassword} />
          <DangerZoneRow requiresPassword={hasPassword} />
        </>
      }
    />
  );
}
