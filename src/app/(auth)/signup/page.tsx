import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Create account</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Create an account, then verify the 6-digit code sent to your email.
      </p>
      <SignupForm />
    </div>
  );
}
