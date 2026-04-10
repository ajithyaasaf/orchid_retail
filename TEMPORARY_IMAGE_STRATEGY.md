# Temporary Image Strategy

This document outlines the best practices for implementing temporary product images (e.g., using services like Picsum or Unsplash) during development, ensuring that the transition to our permanent image hosting solution (Cloudinary) is seamless and requires minimal code changes.

## Goal
To display visually appealing temporary images for products without hardcoding external dependencies into the core application logic or configuration files. This ensures easy reversibility.

## Core Principles

### 1. Isolate Changes to Seed Data
The absolute cleanest way to implement temporary images is to **only** modify the data generation logic.
- **Where:** `backend/prisma/seed.ts` (specifically the `generateImageUrls` function).
- **Why:** The frontend expects an array of string URLs and doesn't care about their origin. By injecting temporary URLs (e.g., `https://picsum.photos/seed/{product-slug}/600/800`) directly into the database via the seed script, the actual application code remains **100% untouched**.
- **How to revert:** When the permanent system is ready, simply update the seed script to use the real Cloudinary URLs and re-seed the database.

### 2. Use Environment Variables for Fallbacks
Currently, the frontend has a hardcoded fallback image in `frontend/src/components/product/ProductCard.tsx` (`https://placehold.co/...`).
- **Where:** Move this fallback URL to an environment variable in your `.env` file (e.g., `NEXT_PUBLIC_DEFAULT_IMAGE_URL`).
- **Why:** This prevents hardcoding temporary external URLs into React components.
- **How to revert:** To switch back to the original placeholder or a permanent local fallback, you only need to update the `.env` file. No code commits or component hunting is required.

### 3. Stick to Standard `<img>` Tags Temporarily
The current codebase uses standard HTML `<img>` tags for product images. 
- **Why:** If you upgrade to the optimized Next.js `<Image>` component right now, you will be forced to modify `next.config.ts` to whitelist the temporary external image domains (`images.remotePatterns`). 
- **Benefit:** By sticking with standard `<img>` tags for this temporary phase, you avoid polluting configuration files. Zero config changes means zero config files to clean up later when removing the temporary image service.

## Summary of Reversion
When you are ready to implement the final Cloudinary integration:
1. Update `backend/prisma/seed.ts` to output real image URLs.
2. Update the `NEXT_PUBLIC_DEFAULT_IMAGE_URL` environment variable.
3. (Optional but recommended) Upgrade standard `<img>` tags to Next.js `<Image>` components and configure `next.config.ts` for your permanent image host.

Following this strategy ensures the codebase remains clean and free of "temporary hacks" that are easily forgotten.