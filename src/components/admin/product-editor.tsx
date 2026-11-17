"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, ImagePlus, LoaderCircle } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { AdminApiError, adminRequest } from "@/lib/admin-client";
import type { ManagedProduct } from "@/types/admin";

export type ProductInput = Omit<ManagedProduct, "id" | "archived">;

export default function ProductEditor({
  product,
  onSave,
  onClose,
}: {
  product: ManagedProduct | null;
  onSave: (data: ProductInput) => Promise<void>;
  onClose: () => void;
}) {
  const [available, setAvailable] = useState(product?.isAvailable ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [image, setImage] = useState(
    product?.image ??
      (product ? `/images/${product.id}.webp` : "/images/hero.webp"),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget);
    const cuts = String(values.get("cuts") || "")
      .split("\n")
      .map((cut) => cut.trim())
      .filter(Boolean);
    if (
      !cuts.length ||
      cuts.length > 12 ||
      cuts.some((cut) => cut.length > 80)
    ) {
      setError(
        "Add 1–12 preparation options, each up to 80 characters, with one option per line.",
      );
      return;
    }
    const price = String(values.get("price") || "").trim();
    if (
      price &&
      (!Number.isFinite(Number(price)) ||
        Number(price) < 0 ||
        Number(price) > 1_000_000)
    ) {
      setError(
        "Enter a price from ₹0 to ₹10,00,000, or leave it empty for price on request.",
      );
      return;
    }
    setPending(true);
    setError("");
    setSessionExpired(false);
    try {
      let savedImage = image;
      if (file) {
        const upload = new FormData();
        upload.set("file", file);
        const media = await adminRequest<{ image: string }>(
          "/api/admin/media",
          { method: "POST", body: upload },
        );
        savedImage = media.image;
        setImage(savedImage);
        setFile(null);
      }
      await onSave({
        nameEn: String(values.get("nameEn") || "").trim(),
        nameTe: String(values.get("nameTe") || "").trim(),
        descEn: String(values.get("descEn") || "").trim(),
        descTe: String(values.get("descTe") || "").trim(),
        category: String(values.get("category")) as ManagedProduct["category"],
        pricePerKg: price ? Number(price) : null,
        badge: String(values.get("badge") || "").trim(),
        cuts,
        isAvailable: available,
        image: savedImage,
        icon: product?.icon ?? "🐟",
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your product could not be saved. Please try again.",
      );
      setSessionExpired(
        failure instanceof AdminApiError && failure.status === 401,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      onKeyDownCapture={(event) => {
        if (pending && event.key === "Escape") event.preventDefault();
      }}
    >
      <Dialog
        locked={pending}
        title={product ? "A little fine-tuning." : "Meet the new catch."}
        eyebrow={product ? "EDIT PRODUCT" : "ADD TO YOUR CATALOGUE"}
        wide
        onClose={() => {
          if (!pending) onClose();
        }}
      >
        <form className="admin-product-form" onSubmit={submit}>
          <p className="admin-dialog-intro">
            {product
              ? "Update the details your customers see in the shop."
              : "Add a variety, set its price and make it ready for your customers."}
          </p>
          <fieldset className="admin-form-section" disabled={pending}>
            <legend>
              <span>01</span> The essentials
            </legend>
            <div className="admin-form-grid">
              <label className="admin-field">
                Product name · English
                <input
                  name="nameEn"
                  required
                  minLength={2}
                  maxLength={120}
                  defaultValue={product?.nameEn ?? ""}
                  placeholder="e.g. Fresh Prawns"
                />
              </label>
              <label className="admin-field">
                Product name · Telugu{" "}
                <span className="admin-optional">Optional</span>
                <input
                  name="nameTe"
                  lang="te"
                  maxLength={120}
                  defaultValue={product?.nameTe ?? ""}
                  placeholder="e.g. తాజా రొయ్యలు"
                />
              </label>
              <label className="admin-field">
                Category
                <select
                  name="category"
                  defaultValue={product?.category ?? "freshwater"}
                >
                  <option value="freshwater">Freshwater fish</option>
                  <option value="marine">Marine fish</option>
                  <option value="shellfish">Prawns & crabs</option>
                </select>
              </label>
              <label className="admin-field">
                Product badge <span className="admin-optional">Optional</span>
                <input
                  name="badge"
                  maxLength={60}
                  defaultValue={product?.badge ?? ""}
                  placeholder="e.g. Customer favourite"
                />
              </label>
              <label className="admin-field">
                Description · English
                <textarea
                  name="descEn"
                  rows={3}
                  maxLength={1200}
                  defaultValue={product?.descEn ?? ""}
                  placeholder="Tell customers a little about this variety."
                />
              </label>
              <label className="admin-field">
                Description · Telugu{" "}
                <span className="admin-optional">Optional</span>
                <textarea
                  name="descTe"
                  lang="te"
                  rows={3}
                  maxLength={1200}
                  defaultValue={product?.descTe ?? ""}
                  placeholder="తెలుగులో వివరణ"
                />
              </label>
            </div>
            <p className="admin-field-help">
              English is used when a Telugu name or description is left empty.
            </p>
          </fieldset>
          <fieldset className="admin-form-section" disabled={pending}>
            <legend>
              <span>02</span> Price & preparation
            </legend>
            <div className="admin-form-grid">
              <label className="admin-field">
                Price per kg
                <div className="admin-price-input">
                  <span>₹</span>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    defaultValue={product?.pricePerKg ?? ""}
                    placeholder="Price on request"
                  />
                </div>
                <small>
                  Leave empty if customers should ask for the price.
                </small>
              </label>
              <div className="admin-editor-stock">
                <div>
                  <span className="admin-field-label">Availability</span>
                  <p>
                    {available
                      ? "Ready for customers to order."
                      : "Shown as sold out in the shop."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={available}
                  aria-label="Available in the shop"
                  className={`admin-switch${available ? " is-on" : ""}`}
                  onClick={() => setAvailable((value) => !value)}
                >
                  <span>{available && <Check size={11} />}</span>
                </button>
              </div>
              <label className="admin-field admin-field-full">
                Preparation options
                <textarea
                  name="cuts"
                  rows={3}
                  maxLength={972}
                  defaultValue={
                    product?.cuts.join("\n") ?? "Whole fish\nCurry cut\nFry cut"
                  }
                  placeholder={"Whole fish\nCurry cut\nFry cut"}
                  required
                />
                <small>One option per line. Add up to 12 options.</small>
              </label>
            </div>
          </fieldset>
          <fieldset className="admin-form-section" disabled={pending}>
            <legend>
              <span>03</span> A good first impression
            </legend>
            <div className="admin-photo-editor">
              <div className="admin-photo-preview">
                <Image
                  src={preview || image}
                  fill
                  unoptimized
                  sizes="160px"
                  alt="Product photo preview"
                />
              </div>
              <div>
                <label className="admin-upload-button">
                  <ImagePlus size={17} />
                  <span>
                    {file ? "Choose another photo" : "Choose a photo"}
                  </span>
                  <input
                    className="admin-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label="Upload product photo"
                    onChange={(event) => {
                      const selected = event.currentTarget.files?.[0];
                      if (!selected) return;
                      if (
                        !["image/jpeg", "image/png", "image/webp"].includes(
                          selected.type,
                        ) ||
                        selected.size > 5 * 1024 * 1024
                      ) {
                        setError(
                          "Choose a JPEG, PNG or WebP photo no larger than 5 MB.",
                        );
                        event.currentTarget.value = "";
                        return;
                      }
                      setError("");
                      setFile(selected);
                      setPreview(URL.createObjectURL(selected));
                    }}
                  />
                </label>
                <p>{file ? file.name : "JPEG, PNG or WebP · Up to 5 MB"}</p>
                <small>
                  {product
                    ? "Your current photo stays until you choose a new one."
                    : "A shop photo is used until you add your own."}
                </small>
              </div>
            </div>
          </fieldset>
          {error && (
            <div className="admin-notice admin-notice-error" role="alert">
              <div>
                {error}
                {sessionExpired && (
                  <Link
                    href="/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-reauth-link"
                  >
                    Sign in again
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          )}
          <div className="admin-dialog-actions">
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-button admin-button-primary"
              disabled={pending}
            >
              {pending ? (
                <>
                  <LoaderCircle size={16} className="admin-spin" /> Saving…
                </>
              ) : (
                <>
                  {product ? "Save changes" : "Add product"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
