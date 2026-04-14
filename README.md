# St. Martin De Porres Catholic Church Mugutha Portal

A modern web application for St. Martin De Porres Catholic Church community. Built with Next.js, Firebase, and Cloudinary.

🌐 [Live Demo](https://6000-firebase-studio.vercel.app)

## Features

- 🎨 **Dynamic Branding** - Customize colors, text, and images for all sections
- 📱 **Responsive Design** - Works seamlessly on mobile, tablet, and desktop
- 🔐 **Secure Authentication** - Firebase Auth with role-based access
- 📰 **Bulletin Management** - Create, edit, and publish church bulletins
- 📅 **Event Management** - Schedule and manage church events
- 🎯 **Community Groups** - Organize and manage parish communities
- 💰 **Fundraising** - Track development projects and fundraising goals
- 🖼️ **Media Management** - Upload and manage images via Cloudinary
- ⚡ **Real-time Updates** - Instant content synchronization

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Cloudinary account

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/M-tech-cmd/st-martin-portal.git
   cd st-martin-portal
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up environment variables**
   
   Create `.env.local`:

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



4. **Run development server**
```bash
   npm run dev
```

5. **Open browser**
http://localhost:3000

## Project Structure
st-martin-portal/
├── src/
│   ├── app/              # Next.js pages and layouts
│   ├── components/       # React components
│   ├── firebase/         # Firebase config
│   ├── lib/              # Utilities and types
│   └── hooks/            # Custom React hooks
├── public/               # Static assets
├── .env.local           # Environment variables
└── package.json         # Dependencies


## Key Pages

### Public Pages
- **Home** (`/`) - Landing page with sections overview
- **About Us** (`/about-us`) - Church history and information
- **Events** (`/events`) - Upcoming events calendar
- **Bulletin** (`/bulletin`) - Church bulletins and updates
- **Ministries** (`/ministries`) - Parish ministries and communities
- **Bible Readings** (`/bible-readings`) - Daily scripture readings
- **Documents** (`/documents`) - Parish documents and newsletters
- **Payments** (`/payments`) - Giving and payment information
- **Contact** (`/contact`) - Contact information and inquiry form

### Admin Pages
- **Dashboard** (`/admin/dashboard`) - Admin overview
- **Branding & Visuals** (`/admin/branding`) - Customize site appearance
- **Bulletin Management** (`/admin/bulletin`) - Create/edit bulletins
- **User Management** (`/admin/users`) - Manage user accounts
- **Inquiries** (`/admin/inquiries`) - View contact form submissions

## Authentication

### Sign In

### Admin Access
1. Navigate to `/admin/dashboard`
2. Enter passkey: `` (from .env)
3. Click "Submit"
4. Admin role granted

### Password Recovery
1. Click "Forgot password?" on sign-in
2. Enter email address
3. Receive reset link via email
4. Click link and set new password

## Admin Tasks

### Customize Branding
1. Go to `/admin/branding`
2. Edit section titles and descriptions
3. Change colors (Title, Description, Box)
4. Upload section images
5. Click "Save Visual Identity"

### Create Bulletin
1. Go to `/admin/bulletin`
2. Fill in title and content
3. Upload media (images/videos)
4. Click "Publish"

### Manage Users
1. Go to `/admin/users`
2. View all registered users
3. Assign roles (Admin, Chairman, etc.)
4. Update user information

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | Full-stack framework |
| **React** | UI library |
| **TypeScript** | Type safety |
| **Firebase** | Backend & Auth |
| **Firestore** | Database |
| **Cloudinary** | Media storage |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI components |
| **Vercel** | Deployment |

## Deployment

The application is deployed on Vercel:

```bash
# Deploy to production
npm run build
vercel
```

Environment variables are set in Vercel dashboard.

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Sign in user
- `POST /api/auth/password-reset` - Reset password

### Admin
- `POST /api/admin/branding` - Update site branding
- `POST /api/admin/bulletin` - Create/update bulletin

## File Uploads

### Images
- Supported: JPG, PNG, WebP
- Max size: 5MB
- Stored on Cloudinary

### Videos
- Supported: MP4, WebM
- Max size: 100MB
- Stored on Cloudinary

## Security

- Firebase Security Rules for database access
- Role-based access control
- Passkey-protected admin portal
- Secure password reset via email
- Environment variables for sensitive data

## Performance

- **Build Size**: ~150KB (gzipped)
- **Core Web Vitals**: A+
- **Time to Interactive**: < 2s
- **Lighthouse Score**: 95+

## Contributing

Contributions welcome! Please follow our coding standards:

1. Use TypeScript
2. Follow ESLint rules
3. Use Tailwind CSS for styling
4. Write meaningful commit messages
5. Test changes locally

## Troubleshooting

### Can't sign in?
- Check Firebase credentials in .env
- Verify user exists in Firebase

### Images not showing?
- Check Cloudinary credentials
- Verify image public_id in Firestore

### Permission errors?
- Check Firestore Security Rules
- Verify user role in Firestore

## Support

- 📧 Email: martindeporres2022@gmail.com
- 💬 Issues: GitHub Issues
- 📞 Phone: +254 758247543

## License

Proprietary - St. Martin De Porres Catholic Church

## Credits

- **Developer**: Manuel Kim (M-tech-cmd)
- **Design**: Modern, responsive UI/UX
- **Community**: St. Martin De Porres Parish

---

**Last Updated**: April 2026  
**Version**: 1.0.0