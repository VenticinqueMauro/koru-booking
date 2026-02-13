import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { schedulesApi } from '../api/schedules';
import { Schedule, CreateScheduleInput } from '../types';
import { Layout } from '../components/Layout';
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
      toast.success('Horario guardado correctamente');
    },
    onError: () => {
      toast.error('Error al guardar el horario');
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

  const validateAndSave = () => {
    // Si está deshabilitado, guardar sin validación
    if (!enabled) {
      onSave({
        dayOfWeek: dayValue,
        enabled,
        startTime,
        endTime,
        breakStart: breakStart || undefined,
        breakEnd: breakEnd || undefined,
      });
      return;
    }

    // Validación: startTime debe ser menor que endTime
    if (startTime >= endTime) {
      toast.error('La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    // Validación: si hay break, ambos campos deben estar presentes
    if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
      toast.error('Debes especificar tanto la hora de inicio como la de fin del descanso');
      return;
    }

    // Validación: si hay break, breakStart debe ser menor que breakEnd
    if (breakStart && breakEnd && breakStart >= breakEnd) {
      toast.error('La hora de inicio del descanso debe ser menor que la hora de fin');
      return;
    }

    // Validación: el break debe estar dentro del horario laboral
    if (breakStart && breakEnd) {
      if (breakStart < startTime || breakEnd > endTime) {
        toast.error('El descanso debe estar dentro del horario laboral');
        return;
      }
    }

    onSave({
      dayOfWeek: dayValue,
      enabled,
      startTime,
      endTime,
      breakStart: breakStart || undefined,
      breakEnd: breakEnd || undefined,
    });
  };

  // Auto-save cuando cambia el switch
  const handleSwitchChange = (checked: boolean) => {
    setEnabled(checked);
    // Save immediately with new enabled state
    onSave({
      dayOfWeek: dayValue,
      enabled: checked,
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
            onCheckedChange={handleSwitchChange}
            id={`day-${dayValue}`}
            disabled={isSaving}
          />
          <Label htmlFor={`day-${dayValue}`} className="text-base font-medium cursor-pointer">
            {label}
          </Label>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
                  onBlur={validateAndSave}
                  disabled={isSaving}
                  className="w-28"
                />
                <span className="text-muted-foreground text-sm">a</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  onBlur={validateAndSave}
                  disabled={isSaving}
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
                  onBlur={validateAndSave}
                  disabled={isSaving}
                  className="w-28"
                />
                <span className="text-muted-foreground text-sm">a</span>
                <Input
                  type="time"
                  value={breakEnd}
                  onChange={(e) => setBreakEnd(e.target.value)}
                  onBlur={validateAndSave}
                  disabled={isSaving}
                  className="w-28"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
