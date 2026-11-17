"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Fish,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { adminRequest } from "@/lib/admin-client";
import BrandLogo from "../brand-logo";

export default function AdminAuth({
  mode,
}: {
  mode: "setup" | "login" | "unavailable";
}) {
  const setup = mode === "setup";
  useEffect(() => { document.documentElement.lang = "en"; }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (setup && password !== data.get("confirmation")) {
      setError("Your passwords do not match. Please enter them again.");
      return;
    }
    setPending(true);
    setError("");
    try {
      if (!setup) await adminRequest("/api/admin/login", { method: "GET" });
      await adminRequest(`/api/admin/${setup ? "setup" : "login"}`, {
        method: "POST",
        body: JSON.stringify({
          email: String(data.get("email") || "").trim(),
          password,
          ...(setup ? { name: String(data.get("name") || "").trim() } : {}),
        }),
      });
      // A fresh server request reads the newly created session cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to sign in. Please try again.",
      );
      setPending(false);
    }
  }

  return (
    <main className="admin-auth">
      <section
        className="admin-auth-story"
        aria-label="Sagar Live Fish owner workspace"
      >
        <Link href="/" className="admin-brand" aria-label="Sagar Live Fish home">
          <BrandLogo preload />
          <small>OWNER WORKSPACE</small>
        </Link>
        <div className="admin-auth-story-copy">
          <span className="admin-kicker">
            From your counter to their kitchen
          </span>
          <h1>
            A fresh start.{" "}
            <br />
            Every day.
          </h1>
          <p>
            Your catch, your prices, your shop.
            <br />
            Keep everything ready for your customers.
          </p>
        </div>
        <div className="admin-auth-photo">
          <Image
            src="/images/hero.webp"
            alt="Fresh fish from Sagar Live Fish"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
            preload
          />
          <span>Freshness is our everyday promise.</span>
        </div>
        <div className="admin-auth-story-foot">
          <span>THE SAME TRUST. A LITTLE MORE CONTROL.</span>
          <Fish size={20} strokeWidth={1.2} />
        </div>
      </section>
      <section className="admin-auth-main">
        <Link href="/" className="admin-back-link">
          <ArrowLeft size={15} /> Back to the storefront
        </Link>
        <div className="admin-auth-card">
          <span className="admin-auth-lock">
            <LockKeyhole size={24} strokeWidth={1.5} />
          </span>
          <p className="admin-kicker">
            {setup
              ? "YOUR SHOP, READY TO MANAGE"
              : "A LITTLE BEHIND THE COUNTER"}
          </p>
          <h2>
            {setup
              ? "Make it yours."
              : mode === "unavailable"
                ? "Setup is closed."
                : "Welcome back."}
          </h2>
          <p className="admin-auth-intro">
            {setup
              ? "Create your owner account to manage the catalogue, daily prices and availability."
              : mode === "unavailable"
                ? "The owner account needs to be created from this shop’s local development server before you can sign in here."
                : "Sign in to take care of today’s catalogue."}
          </p>
          {mode !== "unavailable" && (
            <form onSubmit={submit} className="admin-auth-form">
              {setup && (
                <label className="admin-field">
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    placeholder="Owner name"
                    disabled={pending}
                  />
                </label>
              )}
              <label className="admin-field">
                Email or username
                <input
                  name="email"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  maxLength={254}
                  placeholder="owner or you@example.com"
                  disabled={pending}
                />
              </label>
              <label className="admin-field">
                Password
                <div className="admin-password-field">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={setup ? "new-password" : "current-password"}
                    required
                    minLength={setup ? 12 : undefined}
                    maxLength={128}
                    placeholder={
                      setup ? "At least 12 characters" : "Enter your password"
                    }
                    disabled={pending}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              {setup && (
                <label className="admin-field">
                  Confirm password
                  <input
                    name="confirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                    placeholder="Enter your password again"
                    disabled={pending}
                  />
                </label>
              )}
              {error && (
                <p className="admin-notice admin-notice-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="admin-button admin-button-primary admin-auth-submit"
                disabled={pending}
                type="submit"
              >
                {pending
                  ? "Please wait…"
                  : setup
                    ? "Create owner account"
                    : "Sign in"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
          <div className="admin-auth-reassurance">
            <ShieldCheck size={17} />
            <p>
              {setup
                ? "One account, just for the owner. This first-time setup is available only on the local server."
                : "A private workspace for the shop owner."}
            </p>
          </div>
        </div>
        <p className="admin-auth-footer">
          Sagar Live Fish <span>·</span> Owner access
        </p>
      </section>
    </main>
  );
}
