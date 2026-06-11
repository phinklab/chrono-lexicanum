"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  PREVIEW_COOKIE,
  PREVIEW_PASS,
  PREVIEW_USER,
} from "@/lib/previewGate";

export async function login(formData: FormData): Promise<void> {
  const user = formData.get("user");
  const pass = formData.get("pass");

  if (user !== PREVIEW_USER || pass !== PREVIEW_PASS) {
    redirect("/login?error=1");
  }

  const jar = await cookies();
  jar.set(PREVIEW_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  redirect("/");
}
