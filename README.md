# Kavach 🛡️

Kavach (कवच, "shield") is a lightweight personal safety and emergency alert web app.
It runs entirely in the browser with no backend, no accounts and no dependencies,
so you can open it on your phone and use it right away.

## Features

- **SOS alarm** with a loud siren, vibration and flashing screen
- **PIN-locked alarm**: a 4–6 digit PIN is required to end it
- **Silent alarm mode** with no siren or flashing, on a dim screen
- **Safe walk timer** with optional recurring check-ins (every 5, 10 or 15 minutes);
  missing a check-in triggers the alarm
- **Live location link**: saves your GPS position and adds a Google Maps link to the alert
- **Trusted contacts**: one-tap call and text buttons plus a copyable alert message
- **English and Hindi** alert messages
- **Activity log** of alarms, walks, check-ins and PIN changes
- **Setup checklist** to guide first-time configuration

## Project structure
kavach/
├── index.html # Page structure
├── style.css # Styling
└── script.js # App logic


## Getting started

1. Clone the repo: `git clone https://github.com/<your-username>/kavach.git`
2. Open `index.html` in a browser, or serve the folder with any static host
   (GitHub Pages works well).
3. Add a trusted contact, set a PIN, and test the siren from the setup checklist.

## Limitations

- A web page cannot send SMS or place calls on its own. Kavach gives you call and
  text buttons and a ready-to-send message instead.
- Timers can pause if the page is closed or the phone locks, so keep the app open
  during a walk.
- The PIN is a screen lock, not strong security.
- Location sharing needs browser location permission.
