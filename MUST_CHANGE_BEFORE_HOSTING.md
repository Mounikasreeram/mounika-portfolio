# Must Change Before Hosting

These are the values you should confirm before publishing the portfolio.

## Personal Details

- `utils/data/personal-data.js`
  - Confirm `email`, `phone`, `address`, `linkedIn`, and `resume`.
  - Add `github`, `leetcode`, `twitter`, `facebook`, or `stackOverflow` only if you want those icons visible.
- `utils/data/contactsData.js`
  - Keep this in sync with `personal-data.js` if you use it later.

## Resume And Photo

- `public/resume.pdf`
  - This is the PDF linked by the Get Resume button.
- `public/profile.png`
  - This is the profile photo shown in the About section.

## Portfolio Content

- `utils/data/projects-data.js`
  - Replace or refine project descriptions if any project names/details should be private.
- `utils/data/experience.js`
  - Confirm role titles and dates.
- `utils/data/skills.js`
  - Add or remove skills based on what you want recruiters to see first.

## Contact Form

- Without backend settings, the form opens the visitor's email app using `mailto:`.
- To send messages directly from the site, deploy as a Node/Next.js app and configure:
  - `NEXT_PUBLIC_APP_URL`
  - `EMAIL_ADDRESS`
  - `GMAIL_PASSKEY`


## Chatbot

- `app/components/portfolio-chatbot.jsx`
  - Current chatbot is a static portfolio assistant, so it works on GoDaddy static hosting.
  - For a real AI chatbot using an LLM, add a backend API route and keep the API key only on the server.

## GoDaddy Hosting

- For GoDaddy VPS or Node hosting, run `npm run build` and serve with `npm start`.
- For GoDaddy shared static hosting, use a static export workflow and keep server-only features disabled.
