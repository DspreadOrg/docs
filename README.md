# Dspread Documentation

[![Deploy to GitHub Pages](https://github.com/DspreadOrg/docs/actions/workflows/deploy.yml/badge.svg)](https://github.com/DspreadOrg/docs/actions/workflows/deploy.yml)

## Live Documentation

The documentation is automatically deployed to GitHub Pages and is available at:
[https://dspreadorg.github.io/docs](https://dspreadorg.github.io/docs)

## Setting Up Documentation Locally

### 1. Clone the repository:

```bash
git clone https://github.com/DspreadOrg/docs.git
```

### 2. Navigate to the docs folder:

```bash
cd docs
```

The docs folder contains the markdown files that make up the documentation. The majority of the files are in the pages directory. Some notable files in this folder include:

`index.mdx`: The main documentation file.
`_app.mdx`: This file is used to customize the default Next.js application shell.
`theme.config.jsx`: This file is for configuring the Nextra theme for the documentation.

### 3. Verify that you have Node.js and npm installed in your system. You can check by running:

```bash
node --version
npm --version
```

### 5. Install the project dependencies using pnpm:

```bash
pnpm install
```

### 6. After the successful installation of the project dependencies, start the local server:

```bash
pnpm dev
```

- Now, you should be able to view the docs on your local environment by visiting `http://localhost:3000`. You can explore the different markdown files and make changes as you see fit.

- **Footnotes:** This guide assumes you have Node.js and npm installed. The guide involves running a local server using pnpm, and viewing the documentation offline. If you encounter any issues, it may be worth verifying your Node.js and npm installations and whether you have installed pnpm correctly.

## Deployment to GitHub Pages

This repository is configured to automatically deploy to GitHub Pages when changes are pushed to the main branch. The deployment is handled by a GitHub Actions workflow defined in `.github/workflows/deploy.yml`.

### Manual Deployment

If you need to manually trigger a deployment:

1. Go to the [Actions tab](https://github.com/DspreadOrg/docs/actions) in the GitHub repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow" and select the branch you want to deploy

### Configuration

The deployment configuration is set up in the following files:

- `.github/workflows/deploy.yml`: GitHub Actions workflow for deployment
- `next.config.js`: Next.js configuration with static export settings
- `public/.nojekyll`: Empty file to prevent GitHub Pages from processing the site with Jekyll
