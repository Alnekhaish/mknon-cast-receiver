# Mknon Cast Receiver

Static web app loaded by Chromecast / Android TV when the Mknon iPhone app starts a Cast session. Renders the public-only Majlis view of the Letters game.

## Files

- `index.html` — entry point loaded on the actual Cast device. Loads Google's CAF Receiver framework.
- `monitor.js` — wires CAF custom-message listener on namespace `urn:x-cast:app.mknon.majlis.letters` and renders snapshots.
- `monitor.css` — visual styling.
- `local-dev.html` — preview page for use in a normal browser. CAF is absent there, so it pumps fake snapshots through `window.applyMajlisSnapshot()` via on-page buttons.

## Local preview (no $5 needed)

Serve the folder over plain HTTP and open `local-dev.html`:

```bash
cd cast-receiver
python3 -m http.server 8000
```

Then visit <http://localhost:8000/local-dev.html> in any browser. Buttons at the bottom-left switch between scenarios (initial, question open, late game, win) so you can iterate on the visuals without a real Cast device.

## Deploying to a real Chromecast

1. Push this folder to any HTTPS-served static host (GitHub Pages, Netlify, Cloudflare Pages — all free).
2. In the [Google Cast SDK Console](https://cast.google.com/publish), create a **Custom Receiver** app. Set the receiver URL to your hosted `index.html`.
3. Pay the **one-time $5** fee in the Cast Console to register your Chromecast / Android TV's serial number as a development device. Without this, your unpublished receiver will not load on a real device.
4. Copy the generated **Application ID** from the Cast Console.
5. In the Flutter app, replace `_receiverAppId` in [`flutter/lib/features/majlis/service/cast_bridge.dart`](../flutter/lib/features/majlis/service/cast_bridge.dart) — currently it's the Cast SDK's default media-receiver id, which is fine for handshake testing but cannot load custom HTML.
6. Rebuild the iOS app, open Letters, tap the Cast icon in the play screen header, pick your TV from the picker. The TV should switch from its idle splash to your receiver showing the monitor view.

## Wire format

The handler iPhone sends one JSON message per game state change on the namespace above. Shape mirrors the Dart `MajlisSnapshot` class — see [`flutter/lib/features/majlis/model/majlis_snapshot.dart`](../flutter/lib/features/majlis/model/majlis_snapshot.dart).

Public fields only — question text, choices, and the correct answer are intentionally NOT included, so the receiver physically cannot leak them to the room.
