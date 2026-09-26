import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Reset password</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Enter the email on the account. Reset delivery is not connected yet.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
