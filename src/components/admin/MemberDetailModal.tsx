
'use client';
import type { MemberProfile, CommunityGroup } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SacramentBadges } from './SacramentBadges';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Phone, Mail, MapPin, Briefcase, Group, Calendar, Users, User, Home, Printer } from 'lucide-react';
import { Button } from '../ui/button';

interface MemberDetailModalProps {
  member: MemberProfile | null;
  onClose: () => void;
  groupMap: { [id: string]: CommunityGroup };
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value || 'N/A'}</p>
        </div>
    </div>
);


export function MemberDetailModal({ member, onClose, groupMap }: MemberDetailModalProps) {
  if (!member) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 2rem;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        
        <div className="p-6 border-b flex justify-between items-center no-print">
            <div>
                <DialogTitle className="text-2xl">{member.fullName}</DialogTitle>
                <DialogDescription>Full Member Records</DialogDescription>
            </div>
            <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Print for Records
            </Button>
        </div>

        <ScrollArea className="flex-1">
            <div id="print-area" className="space-y-6 p-6">
                <div className="hidden print:block text-center border-b pb-6 mb-6">
                    <h1 className="text-3xl font-black">ST. MARTIN DE PORRES PARISH</h1>
                    <p className="text-xl uppercase tracking-widest font-bold text-muted-foreground">Official Member Profile</p>
                    <p className="text-sm mt-2">Document Date: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-none border-2">
                        <CardHeader className="bg-muted/30 py-3"><CardTitle className="text-base">Personal & Professional</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 pt-4">
                            <DetailItem icon={User} label="Full Name" value={member.fullName} />
                            <DetailItem icon={Calendar} label="Age" value={member.age} />
                            <DetailItem icon={MapPin} label="Location" value={member.location} />
                            <DetailItem icon={Phone} label="Phone" value={member.phone} />
                            <DetailItem icon={Briefcase} label="Profession" value={member.profession} />
                            <DetailItem icon={Group} label="Employment" value={member.employmentStatus} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border-2">
                        <CardHeader className="bg-muted/30 py-3"><CardTitle className="text-base">Church Life</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 pt-4">
                            <DetailItem icon={Home} label="Jumuia / SCC" value={groupMap[member.sccId]?.name || 'Not specified'} />
                            <DetailItem icon={Users} label="Parish Group" value={member.parishGroupId ? groupMap[member.parishGroupId]?.name : 'Not specified'} />
                            <DetailItem icon={Group} label="Primary Group Type" value={member.groupType} />
                            <DetailItem icon={Calendar} label="Mass Preference" value={member.sundayMassPreference} />
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="shadow-none border-2">
                    <CardHeader className="bg-muted/30 py-3"><CardTitle className="text-base">Sacramental Information</CardTitle></CardHeader>
                    <CardContent className="pt-4">
                        <SacramentBadges profile={member} />
                    </CardContent>
                </Card>

                <Card className="shadow-none border-2">
                    <CardHeader className="bg-muted/30 py-3"><CardTitle className="text-base">Family Information</CardTitle></CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 rounded-lg border p-3">
                                <h4 className="font-bold text-xs uppercase text-primary">Father's Info</h4>
                                <p className="text-sm"><strong>Name:</strong> {member.fatherInfo?.name || 'N/A'}</p>
                                <p className="text-sm"><strong>Phone:</strong> {member.fatherInfo?.phone || 'N/A'}</p>
                            </div>
                             <div className="space-y-2 rounded-lg border p-3">
                                <h4 className="font-bold text-xs uppercase text-primary">Mother's Info</h4>
                                <p className="text-sm"><strong>Name:</strong> {member.motherInfo?.name || 'N/A'}</p>
                                <p className="text-sm"><strong>Phone:</strong> {member.motherInfo?.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div>
                             <h4 className="font-bold text-sm mb-3 uppercase border-b pb-1">Children ({member.children?.length || 0})</h4>
                             {member.children && member.children.length > 0 ? (
                                <div className="space-y-3">
                                    {member.children.map((child, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/10 grid grid-cols-3 gap-4 items-center">
                                            <div>
                                                <p className="font-bold text-sm">{child.name || `Child ${index+1}`}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">Age: {child.age || 'N/A'}</p>
                                            </div>
                                            <div className="text-xs">{groupMap[child.parishGroupId || '']?.name || 'No Group'}</div>
                                            <div className="flex justify-end">
                                                <SacramentBadges profile={child} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : <p className="text-sm text-muted-foreground italic">No children registered in this profile.</p>}
                        </div>
                    </CardContent>
                </Card>

                <div className="hidden print:block pt-12 mt-12 border-t border-dashed">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <div className="w-48 h-px bg-foreground mb-2"></div>
                            <p className="text-[10px] font-bold uppercase">Parish Priest / Secretary Signature</p>
                        </div>
                        <p className="text-[10px] italic">Verified via St. Martin Hub Digital Registry</p>
                    </div>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
