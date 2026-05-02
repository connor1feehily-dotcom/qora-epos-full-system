# Building the Qora EPOS apps

This project ships **two** installable apps on top of the web/Replit deployment:

| App | Where it runs | What it's for | File |
|---|---|---|---|
| **Qora EPOS** (desktop) | Windows / Linux PC at the till | Full till — sales, scanning, printing, offline | `Qora-EPOS-Setup-1.0.0.exe` (Windows) or `Qora-EPOS-1.0.0.AppImage` (Linux) |
| **Qora EPOS Back Office** (mobile) | Android phone | Back office only — reports, stock, ordering | `Qora-EPOS-BackOffice.apk` |

The web app on the deployed Replit URL keeps working as before — these apps just give Valerie a proper installable icon on the desktop and on the phone, and the desktop one can run **fully offline** at the till.

---

## How to get the installers

You have two choices. **GitHub Actions is the easy one** — it does everything in the cloud and gives you a download link.

### Option A — GitHub Actions (recommended, no setup)

1. Push this project to a GitHub repo (one time).
2. In the repo, go to **Settings → Secrets and variables → Actions** and add one secret:
   - **`QORA_SERVER_URL`** = the URL Valerie's Qora is deployed at, e.g. `https://qora-epos.replit.app`
3. Push any commit to `main`, **or** open the **Actions** tab and click **Run workflow** on:
   - **Build Qora EPOS desktop installer** → produces `qora-epos-windows` (the .exe) and `qora-epos-linux` (the AppImage)
   - **Build Qora EPOS Back Office Android app** → produces `qora-epos-android` (the .apk)
4. When the workflow finishes (about 5–10 min), open the run and download the artifact zip from the bottom of the page. Inside is the installer.

For an official "release" with a clean download page, push a tag:

```bash
git tag v1.0.0
git push --tags
```

The workflows will create a GitHub Release with the `.exe`, `.AppImage` and `.apk` already attached. Send Valerie that single page.

### Option B — Build locally

#### Linux AppImage (works on this Replit machine — already tested)

```bash
bash scripts/desktop-build.sh linux
# → release/Qora-EPOS-1.0.0.AppImage
```

#### Windows .exe (must run on a Windows PC, or Linux with `wine` installed)

On a Windows PC with Node 20:

```bash
git clone <your repo>
cd qora-epos
npm ci
bash scripts/desktop-build.sh win
# → release/Qora-EPOS-Setup-1.0.0.exe
```

#### Android APK (must run on a machine with Android Studio + JDK 17)

```bash
export QORA_SERVER_URL="https://qora-epos.replit.app"
bash scripts/mobile-build.sh
# → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Installing on the till PC (Windows)

1. Copy `Qora-EPOS-Setup-1.0.0.exe` to the till PC (USB stick, network share, or download).
2. Double-click → click through the installer.
3. Qora EPOS now appears in the Start menu and on the desktop.

The desktop app runs the entire EPOS server **inside itself** on a random local port — there's nothing else to install, and it works without internet (sales sync up when the connection comes back).

USB barcode scanners and receipt printers work the same way as in the browser.

## Installing on Valerie's Android phone

1. Email or AirDrop `Qora-EPOS-BackOffice.apk` to her.
2. On the phone, tap the file → "Install from this source" → confirm.
3. The "Qora EPOS Back Office" icon appears on the home screen.
4. First launch asks for the staff PIN — same login as the web back office.

The mobile app **does not** include the till — only back-office screens (reports, stock, suppliers, ordering). Camera scanning still works for stock takes.

## Updating

Whenever a new version is released, just install the new `.exe` over the old one (Windows handles the upgrade) or install the new `.apk` (Android replaces the old one). Settings, till config, and offline queue are preserved.
