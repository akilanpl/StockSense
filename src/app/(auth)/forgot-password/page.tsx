import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Reset password</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Request a 6-digit code, then choose a new password. The code expires in 10 minutes.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
