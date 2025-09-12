# PM Internship

# Frontend

A modern Next.js frontend application built with TypeScript and Tailwind CSS.

## Features

- ⚡ Next.js 14 with App Router
- 🔷 TypeScript for type safety
- 🎨 Tailwind CSS for styling
- 📱 Responsive design
- 🔧 ESLint for code quality
- 🚀 Optimized for production

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, or pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # Reusable components
│   └── ui/            # UI components
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [ESLint](https://eslint.org/) - Code linting

# Backend

## prototype setup

from the project's prototype directory

```
pip install -r requirements.txt
```

start the server and once you see 

```
 * Running on http://127.0.0.1:5000
```

upload the resumes with

```
chmod +x ./resume_uploader.sh
./resume_uploader.sh
```

2 endpoints are exposed

Uploading CVs

to manually upload a cv from a folder

```
curl -X POST -F 'file=@"File Path"' http://127.0.0.1:5000/upload-cv
```

Getting Eligible Candidates

```
curl --get 'http://127.0.0.1:5000/eligible-candidates' --data-urlencode 'q=The Requirements for the Internship' --data-urlencode 'k=6'
```

where q is the requirements text and k is the no. of candidates to be returned's limit