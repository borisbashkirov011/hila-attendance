"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, computeAuthToken, isValidPasscode } from "@/lib/auth";

export type LoginFormState = {
  status: "idle" | "error";
  message?: string;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const passcode = formData.get("passcode");

  if (typeof passcode !== "string" || !isValidPasscode(passcode.trim())) {
    // Slow down brute-force attempts on the short passcode.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { status: "error", message: "קוד שגוי, נסי שוב." };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, await computeAuthToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect("/login");
}
