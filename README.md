# Digital Foundations — tools

Small browser tools and self-check quizzes for the Digital Foundations course at Devine.

Live site: https://vaernewijck.github.io/digital-foundations-tools/

## Layout

- `public/` — everything GitHub Pages serves. `public/tools/<name>/index.html` and `public/self-check/week-XX/index.html`. The landing page lists them per week.
- `wip/` — tools in development. Visible in this repo, never published.

## Publish a tool

```sh
git mv wip/<name> public/tools/<name>
```

Add a link in the week's **Tools** cell in `public/index.html`, commit, push. The workflow in `.github/workflows/pages.yml` deploys `public/` on every push to `main`.

## Add a self-check quiz

Create `public/self-check/week-XX/index.html` and replace the `soon` placeholder in that week's **Self-check** cell in `public/index.html` with a link.
