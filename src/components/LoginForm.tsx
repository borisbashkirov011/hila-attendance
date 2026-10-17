"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginFormState } from "@/lib/actions/auth";

const initialState: LoginFormState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center rounded-full bg-rose-400 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "בודק..." : "כניסה"}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm"
    >
      <input
        name="passcode"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        autoFocus
        required
        aria-label="קוד כניסה"
        className="h-12 rounded-md border border-black/10 bg-transparent px-3 text-center text-xl tracking-[0.5em]"
      />
      {state.status === "error" && (
        <p className="text-center text-sm text-red-600">{state.message}</p>
      )}
      <SubmitButton />
    </form>
  );
}
