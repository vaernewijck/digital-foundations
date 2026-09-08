# Digital Foundations — tools

Small browser tools and self-check quizzes for the Digital Foundations course at Devine.

Live site: https://vaernewijck.github.io/digital-foundations-tools/

## Layout

- `public/` — everything GitHub Pages serves. `public/tools/<name>/index.html` and `public/self-check/<name>/index.html`.
- `wip/` — tools in development. Visible in this repo, never published.

## Publish a tool

```sh
git mv wip/<name> public/tools/<name>
```

Add a line to `public/index.html` under **Tools**, commit, push. The workflow in `.github/workflows/pages.yml` deploys `public/` on every push to `main`.

## Add a self-check quiz

Create `public/self-check/<name>/index.html`, add a line under **Self-check quizzes** in `public/index.html`, push.
