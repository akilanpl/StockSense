import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
      <p className="mt-1 mb-6 text-sm text-muted">
        Use your work email to open the inventory workspace.
      </p>
      <LoginForm />
    </div>
  );
}
