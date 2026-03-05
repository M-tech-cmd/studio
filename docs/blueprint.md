# **App Name**: St. Martin De Porres Parish Hub

## Core Features:

- Public Pages: Displays a comprehensive set of public-facing pages including Home, About Us, Community, Ministries, Events, Development, Documents, Bible Readings, Payments, Contact, Terms of Use, and Privacy Policy.
- Admin Pages: Provides a secure, passkey-protected admin portal with dashboards and management interfaces for Events, Profiles, Documents, Community Groups, Development Projects, Bible Readings, Users, Payments, and Site Content.
- Contact Form with Email Integration: Captures user inquiries via a contact form, sending submissions directly to the parish via SendEmail integration.
- Secure Admin Authentication: Utilizes a secure 6-digit passkey (12345) for admin login, enforcing role-based access control and redirecting non-admin users to an access denied page.
- File Management System: Enables admins to upload and manage files (images, documents) with support for local uploads or image URLs. Supports image preview, and size limits. Includes a React Quill-based rich text editor.
- Dynamic Data Management: Allows for the real-time, Create, Read, Update, and Delete (CRUD) management of key entities like Events, Profiles, Documents, Community Groups, and Projects with real-time updates and error handling. Uses React Query for server state management.
- Bible Reading Content Assistant: Assists in the creation of bible reading and reflection content using AI, helping with suggestions for reflection/homily notes as a tool.

## Style Guidelines:

- Primary color: Cathedral Navy (#1E3A5F) for a deep, reverent tone.
- Background color: Cathedral Cream (#F8F6F3) for a soft, welcoming feel.
- Accent color: Cathedral Gold (#D4A574) for highlights and important actions.
- Font choice: 'Inter', a sans-serif font, will be used for both headlines and body text to maintain a clean and modern aesthetic. Note: currently only Google Fonts are supported.
- Lucide React icons for consistent and clear visual cues across the application.
- A responsive layout utilizing a max width of 7xl and a mobile-first approach for optimal viewing on all devices.
- Subtle CSS transitions for hover states and framer motion for hero section fade-ins to enhance user engagement.