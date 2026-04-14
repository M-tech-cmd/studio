# St. Martin De Porres Catholic Church Portal - Technical Documentation

## Project Overview

The St. Martin De Porres Catholic Church Portal is a comprehensive web application built with Next.js 16, Firebase, and Cloudinary. It serves as a community hub for parishioners to access church information, events, bulletins, and parish activities.

## Technology Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Media Storage**: Cloudinary
- **Deployment**: Vercel
- **UI Components**: shadcn/ui

## Project Structure

src/
├── app/
│   ├── (admin)/           # Admin dashboard and management pages
│   ├── (public)/          # Public-facing pages
│   ├── api/               # Backend API routes
│   └── layout.tsx         # Root layout
├── components/
│   ├── admin/             # Admin-specific components
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout components
│   ├── shared/            # Shared/reusable components
│   └── ui/                # UI components
├── firebase/              # Firebase configuration and utilities
├── lib/
│   ├── types.ts           # TypeScript types
│   ├── upload-utils.ts    # File upload utilities
│   └── constants.ts       # Constants
└── hooks/                 # Custom React hooks




## Core Features

### 1. Authentication
- Firebase Authentication (Email/Password, Google Sign-In)
- Role-based access control (Admin, Chairman, Tech/Dev, Treasurer, Secretary)
- Protected routes and admin-only pages
- Passkey-protected admin portal

### 2. Branding & Visuals
- Dynamic color management for all sections
- Editable section titles and descriptions
- Hero banner customization
- Section-specific styling (Title Color, Description Color, Box Background)
- Image uploads for sections (via Cloudinary)

### 3. Content Management
- Bulletin posts with comments and reactions
- Church events management
- Mass schedule
- Community groups
- Bible readings
- Development projects with fundraising progress
- Static page content (About Us, Contact, Documents)

### 4. Media Management
- Cloudinary integration for image/video storage
- Public IDs for persistent media references
- Automatic URL generation
- Support for multiple media formats

### 5. Admin Dashboard
- Branding & Visuals customization
- Bulletin management
- User account management
- Inquiry inbox
- Financial ledger (admin-only)

## Database Schema (Firestore)

### Collections

#### site_settings/main
- Brand name, logo, description
- Hero section configuration
- Section-specific colors and descriptions
- Global button color
- Parish CTA fields

#### users/{uid}
- User profile (name, email)
- Role assignment
- Admin status
- Custom title and verification icon

#### bulletins/{id}
- Post content
- Author ID
- Media (images/videos)
- Timestamps

#### events/{id}
- Event details
- Dates and times
- Event-specific information

#### masses/{id}
- Mass times
- Priest assignments
- Mass type

#### site_content/{id}
- Static page content
- About Us, Contact, Documents pages

## Firestore Security Rules

The application uses role-based Firestore Security Rules:

```javascript
// Super Admin Check (email or UID)
function isSuperAdmin() {
  return request.auth.token.email == '' || 
         request.auth.uid == '' ||
         request.auth.uid == '';
}

// Admin Check (just super admin for now)
function isAdmin() {
  return isSuperAdmin();
}

// Rule: Only admins can write to site_settings
match /site_settings/{settingsId} {
  allow read: if true;
  allow create, update, delete: if isAdmin();
}
```

## Key Components

### PasskeyModal
- Protects admin portal with 6-digit passkey
- Passkey stored in .env as `NEXT_PUBLIC_ADMIN_PASSKEY`
- Grants admin role upon successful entry

### PasswordRecoveryForm
- Email-based password reset
- Uses Firebase sendPasswordResetEmail()
- Shows success screen with user's email
- 1-hour expiration for reset links

### SectionControls
- Reusable component for managing section styling
- Color pickers for Title, Description, Box background
- Individual reset buttons for each color
- Text input fields for titles and descriptions

### BrandingPage
- Central hub for all visual customization
- Upload section banner images
- Customize all section colors and text
- Save to Firestore

### AuthorDisplay
- Shows role-based author names (not personal names)
- Maps admin roles to display titles
- Used throughout app for consistency

## Environment Variables

Required .env.local variables:

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_PASSKEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=



## Cloudinary Configuration

- **Cloud Name**: 
- **Upload Preset**: 
- **Public ID Format**: `st_martin/{folder}/{filename}`
- **Media Storage**: Persisted using public_id (not URLs)

## API Routes

### POST /api/admin/branding
- Updates site branding settings
- Requires valid auth token
- Checks admin authorization
- Uses Firebase Admin SDK

### Authentication Routes
- Sign in/sign up flows
- Password reset
- Google OAuth integration

## Deployment

Deployed on Vercel:
- **URL**: https://st.martindeporres.vercel.app
- **Branch**: main
- **Auto-deploy**: Enabled on push

## Development Workflow

1. Clone repository
2. Install dependencies: `npm install`
3. Set up .env.local with Firebase credentials
4. Run development server: `npm run dev`
5. Navigate to http://localhost:3000

## Common Tasks

### Adding a New Section to Branding
1. Add fields to `src/lib/types.ts` (SiteSettings)
2. Add schema validation in branding/page.tsx
3. Add SectionControls component call
4. Add reset defaults in handleSectionReset
5. Add display logic in homepage (page.tsx)

### Uploading Media
1. Use ImageUpload or MultiImageUpload components
2. uploadSingleFile or uploadMultipleFiles utilities
3. Stores public_id for persistence
4. Use generateCloudinaryUrl() for display

### Managing Roles
- Hardcoded UIDs in Firestore Rules
- User documents have `role` and `isAdmin` fields
- Role-based components use AuthorDisplay
- Admin checks use isSuperAdmin() function

## Troubleshooting

### Permission Denied Errors
- Check Firestore Rules
- Verify user UID in isSuperAdmin() function
- Ensure auth token is valid

### Undefined Values in Firestore
- Filter undefined before setDoc()
- Use Object.fromEntries with filter
- All form fields must have defaults

### Media Not Displaying
- Check Cloudinary public_id storage
- Verify cloud name and upload preset
- Use generateCloudinaryUrl() for URLs

## Future Enhancements

- [ ] Push notifications for events
- [ ] Social media integration
- [ ] Member directory
- [ ] Giving/donation system improvements
- [ ] Prayer request management
- [ ] Volunteer scheduling

## Support & Contact

For technical issues or feature requests, contact the development team.

---

**Last Updated**: April 2026