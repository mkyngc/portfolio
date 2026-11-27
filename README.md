# Personal Portfolio (HTML / CSS / JS, hosted on GitHub Pages)

Pure static site. The dashboard saves your content by committing it to **this GitHub repository**, and GitHub Pages serves it to every visitor.

## How it works
- `data/content.json` holds all site content. Public pages load it on every visit.
- Photos, resume and certificate files you upload are committed to `assets/uploads/`.
- `/login.html` -> `/admin/dashboard.html` is your editor. Each save is published automatically (watch the pill in the top bar).
- After a publish, GitHub Pages needs about a minute to redeploy before visitors see the change.

## Setup
1. Create a GitHub repo and upload everything in this folder (keep `data/` and `assets/uploads/`).
2. Repo **Settings -> Pages**: Source = *Deploy from a branch*, pick your branch, folder `/ (root)`.
3. Open `https://<username>.github.io/<repo>/login.html` and create your admin login.
4. Go to **Dashboard -> Publishing** and enter your username, repository, branch and a token:
   GitHub **Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens**, repository access = only this repo,
   permission **Contents: Read and write**.
5. Click *Save & test connection*. Edit anything; it goes live.

## Security notes
- The real lock is the **token**: only someone holding it can change the live site. The login page is only a convenience gate in your browser.
- The token is kept in this browser's localStorage. Use your own device, use a fine-grained token limited to this repo, and set an expiry.
- Do not commit the token anywhere.

## Good to know
- Use the dashboard on the deployed site (github.io). Opened from your computer, uploaded images live in GitHub, not in your local folder, so they will not preview locally.
- Files you remove in the dashboard stay in `assets/uploads/` (harmless; delete them on GitHub if you want).
- Uploaded files are limited to 1.5 MB each.
- Editing from another device: log in there, enter the same token, and the latest published content is loaded.
