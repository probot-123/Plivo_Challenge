import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/status/:path*',
  '/api/status',
  '/api/public/:path*',
  '/api/webhook',
  '/[slug]',
  '/[slug]/:path*',
  
  // Authentication routes with the special (.*) pattern that Clerk recommends
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback',
  '/reset-password',
  '/reset-password/:path*',
  '/verify-email',
  '/verify-email/:path*',
  '/onboarding',
  '/onboarding/:path*',
  
  // API test routes (consider removing in production)
  '/api/test'
]);

export default clerkMiddleware(async(auth, req) => {
  if (!isPublicRoute(req)) {
     await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};