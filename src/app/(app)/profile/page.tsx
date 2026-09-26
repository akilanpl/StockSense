import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Profile"
        description="Personal account details for the person using this workspace. No user is signed in yet."
        actions={
          <Link href="/login" className={buttonClassName({ variant: "secondary" })}>
            Log out
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Account</h2>
          <p className="mt-1 mb-4 text-xs leading-5 text-muted">
            These fields are ready for a later sign-in flow. Saving does not create a user.
          </p>
          <ProfileForm />
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Session</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Status</dt>
              <dd>Signed out</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Warehouse</dt>
              <dd>No warehouse selected</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
