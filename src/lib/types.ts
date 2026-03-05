import type { Timestamp } from 'firebase/firestore';

export type NavLink = {
  href: string;
  label: string;
};

export type Mass = {
  id: string;
  day: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
};

export type Value = {
  icon: React.ElementType;
  title: string;
  description: string;
};

export type Event = {
  id: string;
  title: string;
  date: string | Timestamp | Date;
  time: string;
  endTime?: string;
  location: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  category: 'Mass' | 'Ministry' | 'Community' | 'Special' | 'Other' | 'Youth';
  featured: boolean;
  mass?: '1st Mass' | '2nd Mass';
  galleryImages?: string[];
};

export type Profile = {
  id: string;
  name: string;
  title: string;
  bio: string;
  role: 'Pastor' | 'Associate Pastor' | 'Deacon' | 'Staff' | 'Ministry Leader';
  email: string;
  phone: string;
  imageUrl: string;
  imageHint: string;
  active?: boolean;
};

export type CommunityGroup = {
  id: string;
  name: string;
  description: string;
  type: 'Small Christian Community' | 'Group' | 'Choir' | 'Ministry';
  leader: string;
  contact: string;
  schedule: string;
  imageUrl: string;
  imageHint: string;
  memberCount: number;
  familyCount: number;
  goals?: string;
  galleryImages?: string[];
};

export type DevelopmentProject = {
  id:string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  imageUrl: string;
  imageHint: string;
  public: boolean;
  galleryImages?: string[];
};

export type Document = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: 'Bulletin' | 'Newsletter' | 'Form' | 'Policy' | 'Announcement' | 'Other';
  date: string | Timestamp | Date;
  fileType: string;
  public: boolean;
};

export type BibleReading = {
  id: string;
  title: string;
  date: string | Timestamp | Date;
  firstReading: string;
  psalm: string;
  secondReading: string;
  gospel: string;
  reflection?: string;
  published?: boolean;
};

export type VerificationIcon = 'Shield' | 'Gavel' | 'Code' | 'Star' | 'Award' | 'Check';

export type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'user';
  isAdmin?: boolean;
  isVerified?: boolean;
  customTitle?: string;
  verificationIcon?: VerificationIcon;
  hideRealName?: boolean;
  dateJoined: string | Timestamp;
  status?: 'Online' | 'Offline';
  lastSeen?: Timestamp;
  createdAt?: Timestamp;
};

export type SiteContent = {
  id: string;
  pageName: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageHint?: string;
};

export type OfficeHours = {
  open: string;
  close: string;
};

export type SocialPlatform = 'Facebook' | 'Twitter' | 'YouTube' | 'Instagram' | 'LinkedIn';

export type SocialLink = {
  platform: SocialPlatform;
  url: string;
};

export type IconType = 'Bank' | 'Mobile' | 'Cash' | 'CreditCard';

export type PaymentMethod = {
  title: string;
  method: string;
  details: string;
  instructions: string;
  imageUrl?: string;
  iconType?: IconType;
};

export type FinancialEntry = {
  id: string;
  date: Timestamp | Date;
  amount: number;
  category: 'Tithe' | 'Offertory' | 'Donation' | 'Other';
  memberName: string;
  notes?: string;
  createdAt: Timestamp;
};

export type SiteSettings = {
  id: string;
  brandName?: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  officeHours: {
    monday_friday: OfficeHours;
    saturday: OfficeHours;
    sunday: OfficeHours;
  };
  socialLinks: SocialLink[];
  developerCredit: {
    name: string;
    url: string;
  };
  parishDescription: string;
  copyrightYear: number;
  whatsAppNumber?: string;
  showWhatsAppChat?: boolean;
  
  // Maintenance
  maintenanceMode?: boolean;
  maintenanceMessage?: string;

  // Theme Colors
  primaryColor?: string;
  secondaryColor?: string;
  globalTextColor?: string;

  heroTitle?: string;
  heroTitleColor?: string;
  heroDescriptionColor?: string;
  heroImageUrl?: string;

  // Global Section Styling
  globalSectionTitleColor?: string;
  globalSectionDescriptionColor?: string;
  globalSectionBoxColor?: string;
  
  // Section Controls
  massTitle?: string; massDescription?: string; massTitleColor?: string; massDescriptionColor?: string; massBoxColor?: string; massImageUrl?: string;
  eventsTitle?: string; eventsDescription?: string; eventsTitleColor?: string; eventsDescriptionColor?: string; eventsBoxColor?: string; eventsImageUrl?: string;
  clergyTitle?: string; clergyDescription?: string; clergyTitleColor?: string; clergyDescriptionColor?: string; clergyBoxColor?: string; clergyImageUrl?: string;
  bulletinTitle?: string; bulletinDescription?: string; bulletinTitleColor?: string; bulletinDescriptionColor?: string; bulletinBoxColor?: string; bulletinImageUrl?: string;
  projectsTitle?: string; projectsDescription?: string; projectsTitleColor?: string; projectsDescriptionColor?: string; projectsBoxColor?: string; projectsImageUrl?: string;
  communityTitle?: string; communityDescription?: string; communityTitleColor?: string; communityDescriptionColor?: string; communityBoxColor?: string; communityImageUrl?: string;
  ministriesTitle?: string; ministriesDescription?: string; ministriesTitleColor?: string; ministriesDescriptionColor?: string; ministriesBoxColor?: string; ministriesImageUrl?: string;
  bibleReadingsTitle?: string; bibleReadingsDescription?: string; bibleReadingsTitleColor?: string; bibleReadingsDescriptionColor?: string; bibleReadingsBoxColor?: string; bibleReadingsImageUrl?: string;
  documentsTitle?: string; documentsDescription?: string; documentsTitleColor?: string; documentsDescriptionColor?: string; documentsBoxColor?: string; documentsImageUrl?: string;
  findUsTitle?: string; findUsDescription?: string; findUsTitleColor?: string; findUsDescriptionColor?: string; findUsBoxColor?: string; findUsImageUrl?: string;
  paymentsTitle?: string; paymentsDescription?: string; paymentsTitleColor?: string; paymentsDescriptionColor?: string; paymentsBoxColor?: string; paymentsImageUrl?: string;
  
  paymentMethods?: PaymentMethod[];

  // Map settings
  googleMapsEmbedUrl?: string;
};

export type ReactionType = 'amen' | 'blessed' | 'hallelujah';

export type BulletinPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reactions: { [userId: string]: ReactionType };
  galleryImages?: string[];
};

export type BulletinComment = {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorPhotoUrl?: string;
    content: string;
    createdAt: Timestamp;
};

export type ChatMessage = {
    id: string;
    senderId: string;
    text: string;
    createdAt: Timestamp;
};

export type Conversation = {
    id: string;
    participants: string[]; // [parishionerUid, 'parish_office']
    participantNames: { [uid: string]: string };
    lastMessage: string;
    updatedAt: Timestamp;
};

export type ParentInfo = {
    name?: string;
    phone?: string;
};

export type Child = {
    name?: string;
    age?: number;
    baptism?: boolean;
    confirmation?: boolean;
    eucharist?: boolean;
    penance?: boolean;
    anointing?: boolean;
    matrimony?: boolean;
    holyOrders?: boolean;
    parishGroupId?: string;
    customGroupName?: string;
};

export type MemberProfile = {
    id: string;
    userId: string;
    fullName: string;
    age: number;
    maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Other';
    location: string;
    profession: string;
    employmentStatus: 'Student' | 'Job Seeker' | 'Employed' | 'Self-Employed';
    groupType: 'YCS' | 'YCA' | 'Families' | 'Other';
    sundayMassPreference: '1st Mass' | '2nd Mass';
    sccId: string;
    parishGroupId?: string;
    createdAt: Timestamp;
    phone?: string;
    baptism?: boolean;
    confirmation?: boolean;
    eucharist?: boolean;
    penance?: boolean;
    anointing?: boolean;
    matrimony?: boolean;
    holyOrders?: boolean;
    fatherInfo?: ParentInfo;
    motherInfo?: ParentInfo;
    children?: Child[];
};