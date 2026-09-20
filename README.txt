CAPE TOWN TRIP SITE
===================
index.html        the website
tools/            helper scripts for your pictures
pictures/         (created by "npm run folders") YOUR original pictures, one folder per place. Stays on your computer.
photos/           (created by "npm run photos") resized copies + manifest.json. This is what gets published.

Commands (run in the VS Code terminal):
  npm install        once, to install the helpers
  npm run folders    once, creates a folder for every place inside pictures/
  npm run photos     after adding pictures: resizes them and builds photos/
  npm run missing    lists places that still have no pictures
