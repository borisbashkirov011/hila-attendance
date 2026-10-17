import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          היי הילה ✨
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-400">
          הזיני קוד כניסה
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
