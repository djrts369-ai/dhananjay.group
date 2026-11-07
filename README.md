# Dhananjay.group

A minimal, responsive collection of 15 free browser-side utilities built with Next.js, TypeScript and Vercel static export.

## Included tools
1. Image Compressor
2. Image Resizer
3. Image Cropper
4. PDF Merger
5. PDF Splitter
6. PDF to JPG
7. JPG to PDF
8. QR Code Generator
9. Word Counter
10. Password Generator
11. Age Calculator
12. Percentage Calculator
13. GST Calculator
14. Unit Converter
15. JSON Formatter

## Requirements
- Node.js 20 LTS recommended
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Production build
```bash
npm run build
```
Because `output: 'export'` is enabled, Next.js generates the static site in `out/`. Deploy the project to Vercel by importing the Git repository; Vercel detects Next.js and runs the build. The generated static output is suitable for CDN delivery.

## Deploy to Vercel
1. Create a GitHub repository and upload this project.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected Next.js framework and default build command (`npm run build`).
4. Deploy.
5. In Vercel Project → Settings → Domains, add `dhananjay.group` and follow the DNS instructions shown by Vercel.
6. Set the preferred domain as primary after DNS verification.

## Advertising setup
The site includes clearly marked ad placement placeholders only. To activate Google AdSense:
1. Apply for and obtain AdSense approval for `dhananjay.group`.
2. Add the publisher-provided AdSense script in `app/layout.tsx` (inside `<head>` via Next.js metadata/script handling) using the exact publisher ID and script supplied by Google.
3. Replace the two `.ad-slot` placeholders in `app/page.tsx` with responsive ad units using the exact slot IDs issued in your AdSense account.
4. Publish a real Privacy Policy and About/Contact information appropriate to your operation, and add `ads.txt` exactly as provided by AdSense.
5. Do not click your own ads or encourage invalid clicks.

Ads are not active by default. No publisher ID or ad slot has been fabricated.

## Privacy and processing
The image, PDF, QR, calculator and text utilities are designed to process user input locally in the browser. There is no app database, account system, analytics, or file-upload endpoint in this starter. Third-party hosting and browser behavior remain subject to their own policies. The PDF-to-JPG tool uses the locally bundled PDF.js worker.

## Important production checks
- Test with large files and mobile devices. Browser memory and available storage vary.
- PDF merge/split may not work with encrypted or malformed PDFs.
- PDF-to-JPG may trigger multiple-download browser prompts.
- JPG-to-PDF accepts JPEG and PNG inputs.
- Image compression exports JPEG unless the source is PNG; transparency may be lost for JPEG output.
- Image cropper uses percentage coordinates rather than a drag-to-select crop UI.
- Unit conversion supports common length, mass and temperature units only.
- The age calculator uses the visitor's local device date.
- Review and customize the included Privacy Policy and Terms pages, and verify the Contact email before advertising approval. These are starter templates, not legal advice.
- Review dependency security updates periodically. “No maintenance” cannot be guaranteed for any deployed website.

## Tech stack
- Next.js 14
- React 18
- TypeScript
- Tailwind-free custom CSS
- pdf-lib
- PDF.js
- qrcode
- lucide-react
