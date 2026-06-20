# SLParser - StudentLibrary Book Parser 📚
[Русский](README_RUS.md)

A browser console script that exports a book from StudentLibrary — to which
the user already has full legal access — out of its «virtual scrolling» reader
into a clean, structured, standalone HTML file.

> **⚠️ Disclaimer**
> This script is intended solely for **educational purposes** and **personal
> use**. It does not perform any hacking, copy-protection bypass, or
> unauthorized data access. It works **exclusively** with content the user is
> already legally entitled to access (via a paid subscription or institutional
> access) within their authenticated session.
> The repository author does not endorse piracy and bears no responsibility
> for any misuse. All code was generated with the assistance of AI.

---

## 📌 What problem does it solve?

Many educational platforms use *Virtual Scrolling* — text is only rendered
inside the visible viewport and is removed from the DOM on scroll. This means:

- you cannot select and copy more than a few paragraphs at a time;
- the browser's built-in "Save page" produces empty sheets or broken snippets;
- reading is inconvenient on a slow or unstable connection.

---

## 🚀 What does the script do?

1. **Extracts the full text** — automatically fetches and concatenates all
   chapters via the site's API using the current authenticated session.
2. **Generates a title page** — cover image, authors, year, publisher, ISBN
   and annotation.
3. **Restores document structure** — heading hierarchy and a clickable table
   of contents.
4. **Cleans up styles** — strips hostile site CSS and applies a classic
   book-style layout (paragraph indentation, justified text).
5. **Embeds all images** — every image is fetched while the session is still
   active and stored inside the file as a Base64 data URI, making the output
   fully self-contained with no internet connection required.
6. **Auto-downloads the result** — once parsing is complete the browser
   automatically prompts you to save the finished `.html` file.

---

## 📦 Output format

The script produces a **single standalone HTML file** — all text, styles and
images are packed into one document.

This is a universal intermediate format that can easily be converted into
whatever you need

---

## 🛠 How to use

1. Log in to the digital library with your account.
2. Open the book you have legal access to.
3. Press `F12` and go to the **Console** tab.
4. Copy the entire contents of `SLParser.js` and paste it into the console.
5. Press `Enter` and wait — a yellow progress indicator in the top-right corner
   will show the current status.
6. When you see **✅ Сборник успешно сформирован!** the browser will
   automatically download the finished HTML file.
7. Open the file in any tool of your choice for further conversion.

---

## 👨‍💻 Technical details

- Uses page-level global variables `reader_book` (book ID) and
  `reader_access_token` (JWT session token) to make native `fetch` POST
  requests to `/api/3.0/mb4rdr-bff/retrieve/*`.
- A **150 ms** delay between API requests is built in to avoid server-side
  rate limiting.
- Images are fetched with `credentials: include` and a Bearer token, then
  converted to Base64 and embedded directly in the HTML — the output file
  requires no internet connection to view or print.
- The file size may be noticeably larger than the original due to Base64
  encoding of images (+~33% per image).
