import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Create account</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Set up access for the StockSense inventory workspace.
      </p>
      <SignupForm />
    </div>
  );
}
