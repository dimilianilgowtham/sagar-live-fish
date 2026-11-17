"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "../dialog";
import { adminRequest } from "@/lib/admin-client";

export default function PasswordDialog({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget);
    if (values.get("newPassword") !== values.get("confirmation")) {
      setError("Your new passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await adminRequest("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: values.get("currentPassword"), newPassword: values.get("newPassword") }),
      });
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Your password could not be changed.");
      setPending(false);
    }
  }
  return (
    <div className="admin-dialog-wrap">
      <Dialog title="Change your password" eyebrow="OWNER ACCOUNT" onClose={onClose} locked={pending}>
        <p className="admin-password-intro">Use at least 12 characters. Other signed-in devices will be signed out.</p>
        <form className="admin-auth-form" onSubmit={submit}>
          <label className="admin-field">Current password<input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128} disabled={pending} /></label>
          <label className="admin-field">New password<input type="password" name="newPassword" autoComplete="new-password" required minLength={12} maxLength={128} disabled={pending} /></label>
          <label className="admin-field">Confirm new password<input type="password" name="confirmation" autoComplete="new-password" required minLength={12} maxLength={128} disabled={pending} /></label>
          {error && <p className="admin-notice admin-notice-error" role="alert">{error}</p>}
          <div className="admin-dialog-actions">
            <button type="button" className="admin-button admin-button-secondary" onClick={onClose} disabled={pending}>Cancel</button>
            <button className="admin-button admin-button-primary" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
