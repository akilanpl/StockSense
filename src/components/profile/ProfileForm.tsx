import { Input } from "@/components/ui/Input";

export function ProfileForm({
  name = "",
  email = "",
  role = "",
}: {
  name?: string;
  email?: string;
  role?: string;
}) {
  return (
    <div className="space-y-3">
      <Input name="name" label="Name" value={name} readOnly />
      <Input name="email" type="email" label="Email" value={email} readOnly />
      <Input name="role" label="Role" value={role} readOnly />
      <p className="text-xs text-muted">Name, email, and role come from the signed-in account.</p>
    </div>
  );
}
