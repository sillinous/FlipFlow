# FlipFlow Supabase Authentication Setup

This document describes the complete Supabase authentication implementation for FlipFlow.

## Overview

FlipFlow now has a complete authentication system built with Supabase, supporting:
- Email/Password authentication
- Google OAuth
- Protected routes
- Session management with SSR support
- User dashboard and settings

## Files Created

### 1. Core Authentication Files

#### `/lib/supabase.ts`
Supabase client configuration with multiple client types:
- `createSupabaseBrowserClient()` - For client components
- `createSupabaseServerClient()` - For server components and API routes
- `getServiceSupabase()` - Admin client with service role key
- `supabase` - Legacy client for backward compatibility

#### `/components/AuthProvider.tsx`
React Context provider that:
- Manages authentication state globally
- Listens for auth state changes
- Provides `useAuth()` hook for accessing user data
- Handles sign out functionality

#### `/components/UserMenu.tsx`
User menu component that:
- Shows sign in/sign up buttons when logged out
- Displays user avatar and email when logged in
- Provides dropdown menu with links to Dashboard and Settings
- Includes sign out functionality

### 2. Authentication Pages

#### `/app/login/page.tsx`
Complete login/signup page with:
- Email/password authentication
- Google OAuth sign-in
- Toggle between sign in and sign up modes
- Error handling and validation
- Responsive design matching FlipFlow branding

### 3. Protected Routes

#### `/app/dashboard/page.tsx`
Main dashboard for authenticated users showing:
- Welcome message with username
- Stats cards (analyses remaining, total analyses, etc.)
- Quick actions for analyzing deals
- Recent activity section
- Account information sidebar
- Pro tips and upgrade prompts

#### `/app/dashboard/layout.tsx`
Shared layout for dashboard pages with:
- Navigation header
- UserMenu integration
- Consistent styling

#### `/app/dashboard/settings/page.tsx`
User settings page with:
- Account information display
- Password change functionality
- Subscription/plan information
- Success/error messaging

### 4. API Routes

#### `/app/api/auth/callback/route.ts`
OAuth callback handler that:
- Exchanges OAuth code for session
- Redirects to dashboard after authentication
- Works with Google OAuth flow

### 5. Middleware

#### `/middleware.ts`
Route protection middleware that:
- Protects `/dashboard` and `/analyze` routes
- Redirects unauthenticated users to login
- Redirects authenticated users away from login page
- Manages session cookies for SSR

## Environment Variables Required

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### 2. Configure Authentication Providers

#### Enable Email/Password Auth
1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates if needed

#### Enable Google OAuth
1. Go to Authentication > Providers
2. Enable Google provider
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com):
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/api/auth/callback` (for development)
4. Copy Client ID and Client Secret to Supabase
5. Save the configuration

### 3. Configure Site URL

1. Go to Authentication > URL Configuration
2. Set Site URL to your production domain: `https://yourapp.com`
3. Add Redirect URLs:
   - `https://yourapp.com/api/auth/callback`
   - `http://localhost:3000/api/auth/callback`

### 4. Email Templates (Optional)

Customize email templates in Authentication > Email Templates:
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password

## Usage

### Protecting Routes

Routes are automatically protected by the middleware. To add more protected routes, update the `protectedPaths` array in `/middleware.ts`:

```typescript
const protectedPaths = ['/dashboard', '/analyze', '/your-new-protected-route'];
```

### Using Authentication in Components

```typescript
'use client';

import { useAuth } from '@/components/AuthProvider';

export default function YourComponent() {
  const { user, session, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Using Authentication in Server Components

```typescript
import { createSupabaseServerClient } from '@/lib/supabase';

export default async function ServerComponent() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <div>Welcome, {session.user.email}!</div>;
}
```

### Using Authentication in API Routes

```typescript
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your API logic here
  return NextResponse.json({ data: 'success' });
}
```

## User Flow

### Sign Up Flow
1. User visits `/login`
2. Clicks "Don't have an account? Sign up"
3. Enters email and password
4. Receives confirmation email
5. Clicks confirmation link
6. Redirected to `/dashboard`

### Sign In Flow
1. User visits `/login`
2. Enters email and password
3. Clicks "Sign In"
4. Redirected to `/dashboard`

### Google OAuth Flow
1. User visits `/login`
2. Clicks "Continue with Google"
3. Redirected to Google OAuth consent screen
4. Grants permissions
5. Redirected to `/api/auth/callback`
6. Callback exchanges code for session
7. Redirected to `/dashboard`

### Protected Route Access
1. Unauthenticated user tries to access `/dashboard`
2. Middleware intercepts request
3. Redirects to `/login?redirectTo=/dashboard`
4. After login, redirected back to `/dashboard`

## Styling

All authentication pages follow FlipFlow's design system:
- Gradient backgrounds: `from-slate-50 via-blue-50 to-purple-50`
- Primary gradient: `from-blue-600 to-purple-600`
- White cards with shadows
- Consistent spacing and typography
- Lucide React icons

## Security Features

1. **Row Level Security (RLS)**: Enforce access control at database level
2. **Secure Cookies**: Sessions stored in HTTP-only cookies
3. **PKCE Flow**: OAuth uses PKCE for enhanced security
4. **Auto Refresh**: Tokens automatically refreshed
5. **Service Key Protection**: Service role key only used server-side

## Testing

1. **Test Email/Password Auth**:
   - Sign up with a new email
   - Check for confirmation email
   - Confirm email and sign in
   - Test password requirements

2. **Test Google OAuth**:
   - Click "Continue with Google"
   - Complete OAuth flow
   - Verify redirect to dashboard

3. **Test Protected Routes**:
   - Visit `/dashboard` while logged out
   - Verify redirect to `/login`
   - Sign in and verify redirect back to dashboard

4. **Test Sign Out**:
   - Click user menu
   - Click "Sign Out"
   - Verify redirect to home page
   - Try accessing protected route

## Troubleshooting

### OAuth Redirect Mismatch
**Error**: "redirect_uri_mismatch"
**Solution**: Ensure redirect URIs in Google Cloud Console match Supabase callback URL

### Email Confirmation Required
**Error**: "Email not confirmed"
**Solution**: Check spam folder for confirmation email or disable email confirmation in Supabase settings

### Session Not Persisting
**Error**: User logged out after page refresh
**Solution**: Check that cookies are enabled and Supabase URL is correct

### CORS Errors
**Error**: "CORS policy error"
**Solution**: Verify Site URL and Redirect URLs in Supabase settings

## Next Steps

1. **Add Database Tables**: Create tables for user data, analyses, subscriptions
2. **Row Level Security**: Set up RLS policies for data access control
3. **User Profiles**: Create user profile table and management
4. **Usage Tracking**: Track user analyses and enforce limits
5. **Subscription Integration**: Connect Stripe subscriptions to user accounts

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router + Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
