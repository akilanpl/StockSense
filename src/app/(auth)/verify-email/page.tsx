import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Verify email</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Enter the 6-digit code sent to your email. The code expires in 10 minutes.
      </p>
      <VerifyEmailForm initialEmail={email ?? ""} />
    </div>
  );
}
