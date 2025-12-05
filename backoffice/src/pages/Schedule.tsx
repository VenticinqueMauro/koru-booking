import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { Schedule, CreateScheduleInput } from '../types';

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

  if (isLoading) return <div>Cargando horarios...</div>;
  if (error) return <div>Error al cargar horarios</div>;

  /* Lint Fix: ID: 7a9eac34-dfd8-4f0f-99c1-e154b615d952 */
  const schedules = response || [];

  const getDaySchedule = (dayValue: number) => {
    return schedules.find(s => s.dayOfWeek === dayValue) || {
      dayOfWeek: dayValue,
      enabled: false,
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '',
      breakEnd: ''
    } as Partial<Schedule>;
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>📅 Configuración de Horarios</h1>
      <p>Define los horarios de atención para cada día de la semana.</p>

      <div style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
        {DAYS.map(day => (
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
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      opacity: enabled ? 1 : 0.7
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        <div style={{ width: '120px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          <strong style={{ fontSize: '1.1em' }}>{label}</strong>
        </div>

        {enabled && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label>De:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{ padding: '5px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
              />
              <label>A:</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{ padding: '5px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
              <span style={{ color: '#718096', fontSize: '0.9em' }}>Break (opcional):</span>
              <input
                type="time"
                value={breakStart}
                onChange={(e) => setBreakStart(e.target.value)}
                style={{ padding: '5px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
              />
              <span style={{ color: '#718096' }}>-</span>
              <input
                type="time"
                value={breakEnd}
                onChange={(e) => setBreakEnd(e.target.value)}
                style={{ padding: '5px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                backgroundColor: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Guardar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
