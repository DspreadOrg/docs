#!/bin/bash
set -e

# Configuration
REPO_URL="https://github.com/DspreadOrg/docs.git"
BRANCH="main"

# Clean up any previous build artifacts
echo "Cleaning up project..."
rm -rf ./.next
rm -rf ./out

# Create a temporary directory for the deployment
TEMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t 'docs-deploy')"
echo "Using temporary directory: $TEMP_DIR"

# Initialize a new git repository in the temp directory
echo "Initializing Git repository..."
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"
git init
git config --local user.name "Documentation Deployment"
git config --local user.email "docs-deploy@example.com"
git remote add origin "$REPO_URL"

# Create an empty commit to start with
git commit --allow-empty -m "Initial commit"

# Copy only the necessary files to the temp directory
echo "Copying documentation files..."
cd -  # Go back to the original directory

# Copy files, excluding node_modules, build artifacts, and git files
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/out/*" \
  -not -path "*/.git/*" \
  -not -path "*/temp-docs-deploy/*" | while read file; do
  # Create the directory structure in the temp directory
  mkdir -p "$TEMP_DIR/$(dirname "$file")"
  # Copy the file
  cp "$file" "$TEMP_DIR/$file"
done

# Make sure .github directory and other hidden files are copied
cp -r ./.github "$TEMP_DIR/" 2>/dev/null || true
cp .gitignore "$TEMP_DIR/" 2>/dev/null || true
cp .nojekyll "$TEMP_DIR/" 2>/dev/null || true

# Navigate to the temporary directory
cd "$TEMP_DIR"

# Add all files
echo "Adding files to Git..."
git add -A

# Only commit if there are changes
if git diff --cached --quiet; then
  echo "No changes detected. Nothing to commit."
else
  echo "Committing changes..."
  git commit -m "Update documentation website with improved feature cards and fixed GitHub Actions workflow"

  # Push changes directly to GitHub
  echo "Pushing to GitHub repository: $REPO_URL"
  git push -f origin HEAD:$BRANCH
  echo "Deployment complete! Your documentation has been pushed to $REPO_URL"
fi

# Clean up the temporary directory
cd -
rm -rf "$TEMP_DIR"
echo "Temporary directory cleaned up."
