CAPE TOWN TRIP SITE
===================
index.html        the website
sw.js              service worker — makes the site work with no signal once it's hosted for real
manifest.json      lets phones "Add to Home Screen" / install it like an app
icons/             app icons (generated — see "npm run icons" below)
icons/apps/        icons for the "Useful apps" section (placeholders — see below)
tools/             helper scripts for your pictures and icons
pictures/         (created by "npm run folders") YOUR original pictures, one folder per place. Stays on your computer.
photos/           (created by "npm run photos") resized copies + manifest.json. This is what gets published.

Commands (run in the VS Code terminal):
  npm install        once, to install the helpers
  npm run folders    once, creates a folder for every place inside pictures/
  npm run photos     after adding pictures: resizes them and builds photos/
  npm run missing    lists places that still have no pictures
  npm run icons      regenerates icons/ if you ever change the logo colors
  npm run app-icons  regenerates the icons/apps/ placeholders (tools/make-app-icons.js)

Useful-apps icons: each tile in that section looks for icons/apps/<name>.png first — right now
that's a plain colored-letter placeholder. To use the real app icon instead, just save it as
that exact file (square PNG, 128px or bigger) — same names as below — and push it to GitHub
(drag the file into icons/apps/ on github.com, or copy it in locally and commit/push). No code
change needed; the site picks it up automatically and falls back to the placeholder if a file
is ever missing:
  uber.png, bolt.png, uber-eats.png, mr-d.png, pnp-asap.png, pnp-smartshopper.png,
  checkers-sixty60.png, getyourguide.png, klook.png, airalo.png, nomad.png, rova.png, flush.png,
  skyscanner.png, wego.png, airbnb.png, takealot.png

Offline / "Add to Home Screen": only works once this is hosted as a real website (see the
"Photos not showing when you publish/share this page?" tip on the site itself for hosting it
for free on GitHub Pages) — opening index.html directly from your computer (file://) can't
register a service worker, browsers block that. Once hosted over https://, open the site once
online so it can cache itself, and it'll keep working after that with no signal.
