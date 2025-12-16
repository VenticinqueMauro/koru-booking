import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { Schedule, CreateScheduleInput } from '../types';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['schedules'],
    queryFn: schedulesApi.getAll,
  });

  const mutation = useMutation({
    mutationFn: schedulesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      // Optional: Show toast
    },
  });

  const schedules = response || [];

  const getDaySchedule = (dayValue: number) => {
    return (
      schedules.find((s) => s.dayOfWeek === dayValue) ||
      ({
        dayOfWeek: dayValue,
        enabled: false,
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '',
        breakEnd: '',
      } as Partial<Schedule>)
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center text-destructive gap-2">
          <AlertCircle className="h-5 w-5" />
          Error al cargar horarios
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuración de Horarios</h1>
          <p className="text-muted-foreground mt-2">
            Define los horarios de atención para cada día de la semana
          </p>
        </header>

        <div className="space-y-4">
          {DAYS.map((day) => (
            <DayScheduleRow
              key={day.value}
              label={day.label}
              dayValue={day.value}
              currentSchedule={getDaySchedule(day.value)}
              onSave={(data) => mutation.mutate(data)}
              isSaving={mutation.isPending}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function DayScheduleRow({ label, dayValue, currentSchedule, onSave, isSaving }: {
  label: string,
  dayValue: number,
  currentSchedule: Partial<Schedule>,
  onSave: (data: CreateScheduleInput) => void,
  isSaving: boolean
}) {
  const [enabled, setEnabled] = useState(currentSchedule.enabled ?? false);
  const [startTime, setStartTime] = useState(currentSchedule.startTime || '09:00');
  const [endTime, setEndTime] = useState(currentSchedule.endTime || '18:00');
  const [breakStart, setBreakStart] = useState(currentSchedule.breakStart || '');
  const [breakEnd, setBreakEnd] = useState(currentSchedule.breakEnd || '');

  const handleSave = () => {
    onSave({
      dayOfWeek: dayValue,
      enabled,
      startTime,
      endTime,
      breakStart: breakStart || undefined,
      breakEnd: breakEnd || undefined,
    });
  };

  return (
    <Card className={!enabled ? 'opacity-70 bg-muted/30' : ''}>
      <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">

        <div className="flex items-center gap-4 min-w-[150px]">
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            id={`day-${dayValue}`}
          />
          <Label htmlFor={`day-${dayValue}`} className="text-base font-medium cursor-pointer">
            {label}
          </Label>
        </div>

        {enabled && (
          <div className="flex-1 w-full flex flex-col md:flex-row gap-6 items-start md:items-center">

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Horario Laboral</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-28"
                />
                <span className="text-muted-foreground text-sm">a</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-28"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Break / Descanso (Opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={breakStart}
                  onChange={(e) => setBreakStart(e.target.value)}
                  className="w-28"
                />
                <span className="text-muted-foreground text-sm">a</span>
                <Input
                  type="time"
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                  className="w-28"
                />
              </div>
            </div>

            <div className="flex-1 md:text-right w-full md:w-auto mt-2 md:mt-0">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="secondary"
                size="sm"
              >
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                {isSaving ? 'Guardando' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
