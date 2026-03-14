"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Attendance {
  id: string;
  date: string;
  memberEmail: string;
  checkIn: string | null;
  checkOut: string | null;
  member?: Member;
}

interface AttendancePageClientProps {
  initialAttendance: Attendance[];
  initialMembers: Member[];
  gymId: string;
}

export default function AttendancePageClient({ initialAttendance, initialMembers, gymId }: AttendancePageClientProps) {
  const [attendance, setAttendance] = useState<Attendance[]>(initialAttendance);
  const [members] = useState<Member[]>(initialMembers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gymId) {
      toast.error("Selecione uma academia primeiro");
      return;
    }

    if (!formData.memberId || !formData.date) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      const response = await fetch(`/api/attendance?gymId=${gymId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: formData.memberId,
          date: formData.date,
          checkIn: formData.checkIn || null,
          checkOut: formData.checkOut || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(prev => [data, ...prev]);
        toast.success("Frequência registrada!");
        setIsDialogOpen(false);
        setFormData({
          memberId: '',
          date: new Date().toISOString().split('T')[0],
          checkIn: '',
          checkOut: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao registrar");
      }
    } catch (error) {
      toast.error("Erro ao registrar frequência");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Frequência</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Registrar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Frequência</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="memberId" className="text-right">Membro</Label>
                  <select id="memberId" className="col-span-3 border rounded-md px-3 py-2"
                    value={formData.memberId}
                    onChange={(e) => setFormData({...formData, memberId: e.target.value})} required>
                    <option value="">Selecione</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Data</Label>
                  <Input id="date" type="date" className="col-span-3" value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="checkIn" className="text-right">Entrada</Label>
                  <Input id="checkIn" type="time" className="col-span-3" value={formData.checkIn}
                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="checkOut" className="text-right">Saída</Label>
                  <Input id="checkOut" type="time" className="col-span-3" value={formData.checkOut}
                    onChange={(e) => setFormData({...formData, checkOut: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Registrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico ({attendance.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Saída</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{record.member?.name || record.memberEmail}</TableCell>
                    <TableCell>{record.checkIn || '-'}</TableCell>
                    <TableCell>{record.checkOut || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Nenhum registro encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
