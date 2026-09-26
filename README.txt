CAPE TOWN TRIP SITE
===================
index.html        the page skeleton — head, body markup, then <link>/<script src> tags pulling
                   in everything below. No CSS or app logic lives in here anymore.
css/styles.css     all of the site's CSS (used to be a <style> block inside index.html).
js/                the app's code, split into one file per topic — load order matters (that's
                   the order they're listed in index.html) since none of this uses a bundler or
                   ES modules, just plain classic scripts sharing one global scope, same as
                   before the split. To edit something, this is roughly where it lives:
  photo-storage.js       the IndexedDB wrapper photos are saved into
  i18n.js                every English/Arabic UI string (the UI = {en:{...}, ar:{...}} object)
  data-places.js         Cape Town places (the big one — ~700 lines) + categories/neighbourhoods
  notes-and-places.js    your own notes per place, and the "add a custom place" flow
  photos.js              photo upload/lightbox/zip export/GitHub photo sync
  render-map.js          the map, filters, legend, and page-language switching
  data-garden-route.js   Garden Route towns/places data
  data-safari.js         safari lodge comparison data + Garden Route itinerary + hospitals/car rentals
  data-apps.js           the "Useful apps" tile data + App Store link lookup
  data-itinerary.js      hotels + the real 14-day itinerary (ITINERARY14)
  itinerary-customize.js add/remove/move places within the day-by-day plan, the "+ Add" picker
  print-export.js        PDF export, backup download/restore, "Add to Home Screen" prompt
  trip-onboarding.js      visitor onboarding (their own dates/cities/hotels), countdown, .ics export
  weather.js             the whole Open-Meteo weather widget
  drawer-currency.js     the shortlist drawer, actual-spending tracker, currency/budget maths
  app-boot.js            dark mode, tabs, search, and the final boot sequence that starts everything
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
