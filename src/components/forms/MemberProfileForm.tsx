'use client';

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection, query } from 'firebase/firestore';
import type { MemberProfile, CommunityGroup } from "@/lib/types";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, ClipboardCheck, User, Briefcase, MapPin, Calendar, Heart, ShieldCheck, Users, X } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const parentInfoSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
});

const childSchema = z.object({
    name: z.string().optional(),
    age: z.coerce.number().optional(),
    gender: z.enum(['Male', 'Female']).default('Male'),
    baptism: z.boolean().default(false),
    confirmation: z.boolean().default(false),
    eucharist: z.boolean().default(false),
    penance: z.boolean().default(false),
    anointing: z.boolean().default(false),
    matrimony: z.boolean().default(false),
    holyOrders: z.boolean().default(false),
    parishGroupId: z.string().optional(),
    customGroupName: z.string().optional(),
});

const profileSchema = z.object({
  fullName: z.string().min(3, "Full name is required."),
  email: z.string().email("A valid email is required."),
  age: z.coerce.number().min(1, "Age is required."),
  gender: z.enum(['Male', 'Female']),
  maritalStatus: z.enum(['Single', 'Married', 'Widowed', 'Other']),
  location: z.string().min(2, "Location is required."),
  phone: z.string().min(1, "Phone number is required."),
  profession: z.string().min(2, "Profession is required."),
  employmentStatus: z.enum(['Student', 'Job Seeker', 'Employed', 'Self-Employed']),
  groupType: z.enum(['YCS', 'YCA', 'Families', 'Other']),
  sundayMassPreference: z.enum(['1st Mass', '2nd Mass']),
  sccId: z.string().min(1, "Please select your Jumuia."),
  customSccName: z.string().optional(),
  parishGroupId: z.string().optional(),
  customParishGroupName: z.string().optional(),

  baptism: z.boolean().default(false),
  confirmation: z.boolean().default(false),
  eucharist: z.boolean().default(false),
  penance: z.boolean().default(false),
  anointing: z.boolean().default(false),
  matrimony: z.boolean().default(false),
  holyOrders: z.boolean().default(false),
  
  fatherInfo: parentInfoSchema.optional(),
  motherInfo: parentInfoSchema.optional(),
  children: z.array(childSchema).optional(),
});

const SACRAMENT_LABELS = [
    { id: 'baptism', label: 'Baptism' },
    { id: 'confirmation', label: 'Confirmation' },
    { id: 'eucharist', label: 'Holy Communion' },
    { id: 'penance', label: 'Penance (Confession)' },
    { id: 'anointing', label: 'Anointing of Sick' },
    { id: 'matrimony', label: 'Holy Matrimony' },
    { id: 'holyOrders', label: 'Holy Orders' },
];

export function MemberProfileForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const memberProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'members', user.uid);
  }, [firestore, user]);

  const { data: memberProfile, isLoading: isProfileLoading } = useDoc<MemberProfile>(memberProfileRef);
  
  const groupsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'community_groups'));
  }, [firestore]);
  
  const { data: allGroups, isLoading: areGroupsLoading } = useCollection<CommunityGroup>(groupsQuery);

  const { sccGroups, otherGroups } = useMemo(() => {
    const sccs: CommunityGroup[] = [];
    const others: CommunityGroup[] = [];
    if (allGroups) {
        for (const group of allGroups) {
            if (group.type === 'Small Christian Community') {
                sccs.push(group);
            } else {
                others.push(group);
            }
        }
    }
    return { sccGroups: sccs, otherGroups: others };
  }, [allGroups]);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        fullName: '', email: user?.email || '', age: 0, gender: 'Male', maritalStatus: 'Single', location: '', phone: '', profession: '', employmentStatus: 'Employed', groupType: 'Families', sundayMassPreference: '1st Mass',
        sccId: '', customSccName: '', parishGroupId: '', customParishGroupName: '', baptism: false, confirmation: false, eucharist: false, penance: false, anointing: false, matrimony: false, holyOrders: false,
        fatherInfo: { name: '', phone: '' }, motherInfo: { name: '', phone: '' }, children: [],
    }
  });
  
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "children" });

  useEffect(() => {
    if(memberProfile) {
        form.reset({
            ...memberProfile,
            email: memberProfile.email || user?.email || '',
            gender: memberProfile.gender || 'Male',
            sccId: memberProfile.sccId || '',
            parishGroupId: memberProfile.parishGroupId || '',
            children: (memberProfile.children || []).map(c => ({
                ...c,
                gender: c.gender || 'Male',
                baptism: c.baptism || false,
                confirmation: c.confirmation || false,
                eucharist: c.eucharist || false,
                penance: c.penance || false,
                anointing: c.anointing || false,
                matrimony: c.matrimony || false,
                holyOrders: c.holyOrders || false,
            }))
        })
    }
  }, [memberProfile, form, user]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !firestore) return;
    try {
      const sanitizedValues = {
        fullName: values.fullName || "",
        email: values.email || "",
        age: values.age || 0,
        gender: values.gender || 'Male',
        maritalStatus: values.maritalStatus || "Single",
        location: values.location || "",
        phone: values.phone || "",
        profession: values.profession || "",
        employmentStatus: values.employmentStatus || "Employed",
        groupType: values.groupType || "Families",
        sundayMassPreference: values.sundayMassPreference || "1st Mass",
        sccId: values.sccId || "",
        customSccName: values.customSccName || "",
        parishGroupId: values.parishGroupId || "",
        customParishGroupName: values.customParishGroupName || "",
        baptism: values.baptism ?? false,
        confirmation: values.confirmation ?? false,
        eucharist: values.eucharist ?? false,
        penance: values.penance ?? false,
        anointing: values.anointing ?? false,
        matrimony: values.matrimony ?? false,
        holyOrders: values.holyOrders ?? false,
        fatherInfo: {
          name: values.fatherInfo?.name || "",
          phone: values.fatherInfo?.phone || "",
        },
        motherInfo: {
          name: values.motherInfo?.name || "",
          phone: values.motherInfo?.phone || "",
        },
        children: (values.children || []).map(c => ({
          name: c.name || "",
          age: c.age || 0,
          gender: c.gender || 'Male',
          baptism: c.baptism ?? false,
          confirmation: c.confirmation ?? false,
          eucharist: c.eucharist ?? false,
          penance: c.penance ?? false,
          anointing: c.anointing ?? false,
          matrimony: c.matrimony ?? false,
          holyOrders: c.holyOrders ?? false,
          parishGroupId: c.parishGroupId || "",
          customGroupName: c.customGroupName || "",
        })),
      };

      await setDoc(doc(firestore, 'members', user.uid), {
        ...sanitizedValues,
        userId: user.uid,
        id: user.uid,
        updatedAt: serverTimestamp(),
        createdAt: memberProfile?.createdAt || serverTimestamp(),
      }, { merge: true });

      toast({ title: "Registry Updated", description: "Your official church profile is now synchronized." });
      router.push('/');
    } catch (error) {
      console.error("Registry error:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Database connection interrupted." });
    }
  }

  if (isProfileLoading || areGroupsLoading) return <div className="space-y-6 px-4 py-10"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <Card className="border-none shadow-2xl overflow-hidden rounded-3xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 p-8 border-b border-primary/10 text-center sm:text-left">
            <CardTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tighter flex flex-col sm:flex-row items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-primary" />
                PARISHIONER REGISTRY
            </CardTitle>
            <CardDescription className="text-base sm:text-lg font-medium opacity-70">Submit your professional and spiritual details to the official records.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-8">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                 <Accordion type="multiple" defaultValue={['personal', 'church', 'sacraments', 'family']} className="w-full space-y-4">
                    <AccordionItem value="personal" className="border-2 rounded-2xl px-4 sm:px-6 bg-white shadow-sm">
                        <AccordionTrigger className="text-lg sm:text-xl font-bold uppercase tracking-tight hover:no-underline">Identity & Profile</AccordionTrigger>
                        <AccordionContent className="pt-6 pb-8 space-y-8">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Legal Name</FormLabel><FormControl><Input {...field} className="h-12 text-lg font-bold" /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</FormLabel><FormControl><Input {...field} className="h-12" placeholder="email@example.com" /></FormControl></FormItem>
                                )}/>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="age" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Age</FormLabel><FormControl><Input type="number" {...field} className="h-12" /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="gender" render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest">Gender</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex space-x-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Male" id="m" />
                                                        <Label htmlFor="m">Male</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Female" id="f" />
                                                        <Label htmlFor="f">Female</Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="maritalStatus" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12"><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                            {['Single', 'Married', 'Widowed', 'Other'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent></Select></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="location" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Residence (Area)</FormLabel><FormControl><Input {...field} className="h-12" /></FormControl></FormItem>
                                    )}/>
                                </div>
                                 <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Phone Number</FormLabel><FormControl><PhoneInput defaultCountry="KE" {...field} className="h-12" /></FormControl></FormItem>
                                )}/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-dashed pt-8">
                                <FormField control={form.control} name="profession" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Profession</FormLabel><FormControl><Input placeholder="e.g., Teacher, Doctor" {...field} className="h-12" /></FormControl></FormItem>
                                )}/>
                                <FormField control={form.control} name="employmentStatus" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Employment</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12"><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                        {['Student', 'Job Seeker', 'Employed', 'Self-Employed'].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                    </SelectContent></Select></FormItem>
                                )}/>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="church" className="border-2 rounded-2xl px-4 sm:px-6 bg-white shadow-sm">
                        <AccordionTrigger className="text-lg sm:text-xl font-bold uppercase tracking-tight hover:no-underline">Ecclesial Participation</AccordionTrigger>
                        <AccordionContent className="pt-6 pb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <>
                                    <FormField control={form.control} name="sccId" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary">Your Jumuia (SCC) *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-14 text-lg border-primary/20"><SelectValue placeholder="-- Select Jumuia --"/></SelectTrigger></FormControl><SelectContent>
                                            {sccGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                            <SelectItem value="other_scc">Other / New SCC</SelectItem>
                                        </SelectContent></Select></FormItem>
                                    )}/>
                                    {form.watch('sccId') === 'other_scc' && (
                                        <FormField control={form.control} name="customSccName" render={({ field }) => (
                                            <FormItem><FormLabel className="text-[10px] font-bold">New Jumuia Name</FormLabel><FormControl><Input {...field} placeholder="Enter name..." /></FormControl></FormItem>
                                        )}/>
                                    )}
                                </>
                                <>
                                    <FormField control={form.control} name="parishGroupId" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Parish Group (Dropdown)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-14 text-lg"><SelectValue placeholder="-- Select Group --"/></SelectTrigger></FormControl><SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {otherGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name} ({g.type})</SelectItem>)}
                                            <SelectItem value="other_group">Other / Add New Group</SelectItem>
                                        </SelectContent></Select></FormItem>
                                    )}/>
                                    {form.watch('parishGroupId') === 'other_group' && (
                                        <FormField control={form.control} name="customParishGroupName" render={({ field }) => (
                                            <FormItem><FormLabel className="text-[10px] font-bold">New Group Name</FormLabel><FormControl><Input {...field} placeholder="Enter name..." /></FormControl></FormItem>
                                        )}/>
                                    )}
                                </>
                                <FormField control={form.control} name="groupType" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Role (Profile Type)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12"><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                        {['YCS', 'YCA', 'Families', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent></Select></FormItem>
                                )}/>
                                <FormField control={form.control} name="sundayMassPreference" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest">Mass Preference</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-12"><SelectValue/></SelectTrigger></FormControl><SelectContent>
                                        <SelectItem value="1st Mass">1st Mass</SelectItem>
                                        <SelectItem value="2nd Mass">2nd Mass</SelectItem>
                                    </SelectContent></Select></FormItem>
                                )}/>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="sacraments" className="border-2 rounded-2xl px-4 sm:px-6 bg-white shadow-sm">
                        <AccordionTrigger className="text-lg sm:text-xl font-bold uppercase tracking-tight hover:no-underline">Sacramental Status (Member)</AccordionTrigger>
                        <AccordionContent className="pt-6 pb-8 space-y-6">
                            <p className="text-xs text-muted-foreground mb-4 italic">Please check all the sacraments you have received to date.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {SACRAMENT_LABELS.map(sac => (
                                    <FormField key={sac.id} control={form.control} name={sac.id as any} render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border-2 p-4 hover:bg-muted/5 transition-colors cursor-pointer">
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" /></FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-[10px] font-black uppercase tracking-widest cursor-pointer">{sac.label}</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}/>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="family" className="border-2 rounded-2xl px-4 sm:px-6 bg-white shadow-sm">
                        <AccordionTrigger className="text-lg sm:text-xl font-bold uppercase tracking-tight hover:no-underline">Family Records</AccordionTrigger>
                        <AccordionContent className="pt-6 pb-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm uppercase text-primary border-b pb-2">Father</h4>
                                    <FormField control={form.control} name="fatherInfo.name" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold">Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="fatherInfo.phone" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold">Phone</FormLabel><FormControl><PhoneInput defaultCountry="KE" {...field} /></FormControl></FormItem>
                                    )}/>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm uppercase text-primary border-b pb-2">Mother</h4>
                                    <FormField control={form.control} name="motherInfo.name" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold">Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="motherInfo.phone" render={({ field }) => (
                                        <FormItem><FormLabel className="text-[10px] uppercase font-bold">Phone</FormLabel><FormControl><PhoneInput defaultCountry="KE" {...field} /></FormControl></FormItem>
                                    )}/>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-dashed">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h4 className="font-bold text-sm uppercase">Children Registry ({fields.length})</h4>
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', age: 0, gender: 'Male', baptism: false, confirmation: false, eucharist: false, penance: false, anointing: false, matrimony: false, holyOrders: false })} className="rounded-full gap-2">
                                        <PlusCircle className="h-4 w-4" /> Add Child
                                    </Button>
                                </div>
                                
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 sm:p-6 border-2 rounded-2xl space-y-6 bg-muted/5 relative">
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField control={form.control} name={`children.${index}.name`} render={({ field }) => (
                                                <FormItem><FormLabel className="text-[10px] uppercase font-bold">Child Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )}/>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name={`children.${index}.age`} render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[10px] uppercase font-bold">Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                                                )}/>
                                                <FormField control={form.control} name={`children.${index}.gender`} render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] uppercase font-bold">Gender</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Male">Male</SelectItem>
                                                                <SelectItem value="Female">Female</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}/>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <>
                                                <FormField control={form.control} name={`children.${index}.parishGroupId`} render={({ field }) => (
                                                    <FormItem><FormLabel className="text-[10px] uppercase font-bold">Group / Category</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-10"><SelectValue placeholder="-- Select Group --"/></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {otherGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                                        <SelectItem value="other_child_group">Other / Custom</SelectItem>
                                                    </SelectContent></Select></FormItem>
                                                )}/>
                                                {form.watch(`children.${index}.parishGroupId`) === 'other_child_group' && (
                                                    <FormField control={form.control} name={`children.${index}.customGroupName`} render={({ field }) => (
                                                        <FormItem><FormLabel className="text-[10px] font-bold">Group Name</FormLabel><FormControl><Input {...field} placeholder="Enter name..." /></FormControl></FormItem>
                                                    )}/>
                                                )}
                                            </>
                                        </div>
                                        <div className="space-y-3 pt-2">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">The 7 Sacraments Received (Child)</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {SACRAMENT_LABELS.map(sac => (
                                                    <FormField key={sac.id} control={form.control} name={`children.${index}.${sac.id}` as any} render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                            <FormLabel className="text-[10px] font-bold uppercase cursor-pointer">{sac.label}</FormLabel>
                                                        </FormItem>
                                                    )}/>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="flex justify-center sm:justify-end pt-10 border-t-2">
                    <Button type="submit" size="lg" className="h-16 px-12 rounded-full font-black text-lg shadow-xl w-full sm:w-auto" disabled={form.formState.isSubmitting}>
                        {memberProfile ? "UPDATE OFFICIAL RECORDS" : "COMMIT TO REGISTRY"}
                    </Button>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}