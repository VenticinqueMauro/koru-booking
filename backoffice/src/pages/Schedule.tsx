import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { Schedule, CreateScheduleInput } from '../types';
import { Layout } from '../components/Layout';
import { Card, Button } from '../components/ui';
import './Schedule.css';

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
        <div className="schedule-loading">Cargando horarios...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="schedule-error">Error al cargar horarios</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="schedule">
        <header className="page-header">
          <h1 className="page-title">Configuración de Horarios</h1>
          <p className="page-subtitle">
            Define los horarios de atención para cada día de la semana
          </p>
        </header>

        <div className="schedule-grid">
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
    <Card
      padding="lg"
      className={`schedule-day-card ${!enabled ? 'schedule-day-disabled' : ''}`}
    >
      <div className="schedule-day-content">
        <div className="schedule-day-header">
          <label className="schedule-day-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="schedule-checkbox"
            />
            <strong className="schedule-day-label">{label}</strong>
          </label>
        </div>

        {enabled && (
          <>
            <div className="schedule-day-times">
              <div className="schedule-time-group">
                <label className="schedule-time-label">Horario</label>
                <div className="schedule-time-inputs">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="schedule-time-input"
                  />
                  <span className="schedule-time-separator">—</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="schedule-time-input"
                  />
                </div>
              </div>

              <div className="schedule-break-group">
                <label className="schedule-time-label">Break (opcional)</label>
                <div className="schedule-time-inputs">
                  <input
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                    className="schedule-time-input"
                  />
                  <span className="schedule-time-separator">—</span>
                  <input
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                    className="schedule-time-input"
                  />
                </div>
              </div>
            </div>

            <div className="schedule-day-actions">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="secondary"
                size="sm"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
