import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatRole } from "@/lib/format";
import { getCurrentUser } from "@/server/auth";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Profile"
        description={
          user
            ? "Personal account details for the signed-in user."
            : "Personal account details for the person using this workspace. No user is signed in yet."
        }
        actions={
          user ? (
            <LogoutButton className={buttonClassName({ variant: "secondary" })}>Log out</LogoutButton>
          ) : (
            <Link href="/login" className={buttonClassName({ variant: "secondary" })}>
              Sign in
            </Link>
          )
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Account</h2>
          <p className="mt-1 mb-4 text-xs leading-5 text-muted">
            {user
              ? "These details come from the signed-in account. Saving does not update them yet."
              : "These fields are ready for a later sign-in flow. Saving does not create a user."}
          </p>
          <ProfileForm
            name={user?.name}
            email={user?.email}
            role={user ? formatRole(user.role) : ""}
          />
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Session</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Status</dt>
              <dd>{user ? "Signed in" : "Signed out"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Email</dt>
              <dd>{user?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Role</dt>
              <dd>{user ? formatRole(user.role) : "—"}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
