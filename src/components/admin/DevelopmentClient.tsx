'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { DevelopmentProject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { DevelopmentProjectForm } from '@/components/admin/DevelopmentProjectForm';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, deleteDoc, doc, query, updateDoc, orderBy } from 'firebase/firestore';

export function DevelopmentClient() {
  const firestore = useFirestore();
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'development_projects'), orderBy('status'));
  }, [firestore]);

  const { data: projects, isLoading } = useCollection<DevelopmentProject>(projectsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DevelopmentProject | null>(null);
  const { toast } = useToast();

  const handleAddClick = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (project: DevelopmentProject) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const projectDoc = doc(firestore, 'development_projects', id);
    
    toast({ title: 'Removing Project...', description: 'Registry sync initiated.' });

    deleteDoc(projectDoc)
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: projectDoc.path,
                operation: 'delete',
            }));
        });
  };

  const toggleVisibility = (project: DevelopmentProject) => {
    if (!firestore) return;
    const projectDoc = doc(firestore, 'development_projects', project.id);
    const updatedData = { public: !project.public };
    updateDoc(projectDoc, updatedData)
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: projectDoc.path,
                operation: 'update',
                requestResourceData: updatedData,
            }));
        });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Development Projects</h1>
          <p className="text-muted-foreground">
            Create and manage church development and fundraising projects.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects ({projects?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Progress</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : (
                (projects || []).map((project) => (
                    <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>
                        <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'} className={project.status === 'Completed' ? 'bg-green-600 text-white' : ''}>
                        {project.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                            <Progress value={(project.currentAmount / (project.goalAmount || 1)) * 100} className="w-24" />
                            <span className="text-xs text-muted-foreground">{formatCurrency(project.currentAmount)} / {formatCurrency(project.goalAmount)}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center space-x-2">
                        <Switch
                            id={`visibility-switch-${project.id}`}
                            checked={project.public}
                            onCheckedChange={() => toggleVisibility(project)}
                        />
                        <Label htmlFor={`visibility-switch-${project.id}`} className="flex items-center gap-1.5 text-xs">
                            {project.public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            {project.public ? 'Public' : 'Private'}
                        </Label>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditClick(project)}
                        >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the project "{project.title}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(project.id)}>
                                Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isFormOpen && (
        <DevelopmentProjectForm
          project={selectedProject}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
