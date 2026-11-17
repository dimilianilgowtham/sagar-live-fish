# Sagar Live Fish — production launch

The code is prepared for a native Node host with one application replica and a private persistent disk. This document describes the standalone Node/SQLite implementation. A separate cloud implementation serves the public storefront at https://sagar-live-fish.dimilianilgowtham.chatgpt.site; deploying this Node version requires its own compatible host and persistent disk. Do not print a QR for localhost or for the QA URL.

## Runtime and database

Use the supplied Dockerfile (Node 24), or a compatible native Node server. Mount a persistent volume at `/var/data` and set `SAGAR_DATABASE_PATH=/var/data/sagar.sqlite`. SQLite stores the catalogue, uploaded product photos, owner password hash, hashed sessions and change history centrally. It is not a separate database on each customer's phone.

Run one application replica. Do not use an ephemeral function filesystem, or place `.data`, database files or backups in `public/`. A plain static deployment cannot support this owner dashboard. The Docker context and Next file tracing both exclude private runtime data and environment files.

The existing local catalogue and owner account can be preserved by importing a consistent, private database backup into the mounted volume before starting the app. Do not copy only the base `sagar.sqlite` while it is running: committed updates can be in its WAL. Use `npm run db:backup`, which creates and verifies a consistent snapshot. Transfer that private snapshot through the selected host's supported secure workflow, not through the website's public assets or a public source repository.

## Required production configuration

| Setting | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The final public HTTPS origin, with no path or tracking parameters |
| `SAGAR_DATABASE_PATH` | `/var/data/sagar.sqlite` on the mounted persistent volume |
| `PORT` | The host's internal web-service port; defaults to 3000 |
| Replicas | 1 |
| Health check | `/api/health` |

For a completely new database, set `SAGAR_OWNER_LOGIN`, `SAGAR_OWNER_NAME` and `SAGAR_OWNER_PASSWORD` in the host's private secret settings. Use a unique password of at least 12 characters. The first start creates the owner once. Later restarts preserve the existing password; changing the environment secret does not silently reset the account. A demo email ending in `.test` is refused in production.

When importing the configured local database, the existing `owner` login and its privately supplied password are retained. The generated password is deliberately absent from this document, source code, build image and QR poster.

`NEXT_PUBLIC_SITE_URL` is also a Docker build argument because Next inlines public values during the build. Configure the same origin for build and runtime. `railway.toml` selects the Dockerfile, health check and one replica; attaching the persistent volume and configuring the account remain hosting actions.

## Build and start

```sh
npm ci
npm run check
npm start
```

The production launcher loads the production environment, validates the public origin and private database path, refuses demo credentials, creates a verified backup and starts the server. The Docker image runs the standalone server in the same process after bootstrap. Terminate the old deployment before moving the same database volume to another instance.

Choose a Node host with private persistent storage. The public cloud deployment uses a separate backend; it is not a drop-in deployment of this SQLite server.

## Owner access from a phone

Open `https://THE-FINAL-HOSTNAME/admin` in Safari or Chrome. Sign in with the `owner` username and the separately supplied generated password. Save it in the owner's password manager if desired. The account can manage product names, descriptions, preparation options, photos, prices, stock, archive/restore and rate cards. The lock button opens the password form; changing the password signs other devices out.

The customer site works without an account. Phone layouts, bilingual navigation, preparation/quantity selection and the WhatsApp enquiry handoff have been checked. Sending a basket prepares an enquiry; the shop still confirms availability, weight, final price and pickup/delivery.

## Backups and recovery

The production launcher creates a verified startup backup and schedules one daily. It retains seven helper-generated snapshots in a private backup folder beside the database, or in `SAGAR_BACKUP_DIR`. Unrelated files are left alone. Manual backups use:

```sh
npm run db:backup
```

Keep an encrypted off-host copy too; backups on the same volume do not protect against losing that entire volume. Restore while the service is stopped, preserve a fresh backup of the current database, replace the database with a verified snapshot, and restart. A restore must bring over the catalogue, media and owner account together. Do not mix an old base database with a different WAL file.

## Shop QR and printing

After the real HTTPS origin is configured, sign in and open **Rate card → Your shop's website QR**. Download the PNG, or open the A4 poster and print it. The image has a four-module white quiet zone and no logo placed over its data. The QR opens the public website; it does not contain an owner password or a sign-in session.

Offline export is also available:

```sh
npm run qr:generate -- https://THE-FINAL-HOSTNAME
```

This writes a PNG, a vector SVG and a self-contained printable A4 HTML poster to `release/qr/`. Use the permanent origin customers should keep using. Before putting the poster in the shop, scan the actual printed version on an iPhone and Android phone using mobile data. No final shop QR is issued before publication.

## Live acceptance checks still required

After hosting is connected: build the Linux image, import the private backup, verify `/api/health`, test owner sign-in and customer pages over HTTPS, restart the service and verify data survives, check a phone on mobile data, run a bounded HTTP load test on the authorized host and scan the final QR. Refresh the dependency vulnerability audit with network access before release. The current execution environment blocks local test listeners and registry access, so these limits must not be reported as passing tests.

The HTTP harness defaults to an isolated QA server on port 3001:

```sh
SAGAR_TEST_ORIGIN=http://127.0.0.1:3001 npm run test:load
```

It performs 1,000 read requests at 20 concurrent clients and reports errors, throughput and p50/p95/p99 latency. Never point a mutating QA test at the owner's database. Existing multi-page fixture instructions are in the main README.
