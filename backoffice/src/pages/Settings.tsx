import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { UpdateWidgetSettingsInput, WidgetSettings } from '../types';

export default function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateWidgetSettingsInput>({
    layout: 'list',
    stepInterval: 30,
    accentColor: '#00C896',
    notifyEmail: '',
    timezone: 'America/Mexico_City',
  });

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  useEffect(() => {
    if (response) {
      // Asumimos que response es directamente el objeto settings o tiene data
      const settings = (response as any).data || response as unknown as WidgetSettings;
      setFormData({
        layout: settings.layout || 'list',
        stepInterval: settings.stepInterval || 30,
        accentColor: settings.accentColor || '#00C896',
        notifyEmail: settings.notifyEmail || '',
        timezone: settings.timezone || 'America/Mexico_City',
      });
    }
  }, [response]);

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert('Configuración guardada correctamente');
    },
    onError: () => {
      alert('Error al guardar la configuración');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stepInterval' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) return <div>Cargando configuración...</div>;

  return (
    <div style={{ padding: '40px' }}>
      <h1>⚙️ Configuración del Widget</h1>
      <p>Personaliza el aspecto y comportamiento del widget de reservas.</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', marginTop: '30px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Diseño del Widget</label>
          <select
            name="layout"
            value={formData.layout}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
          >
            <option value="list">Lista</option>
            <option value="grid">Cuadrícula</option>
            <option value="compact">Compacto</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Intervalo de Tiempo (minutos)</label>
          <input
            type="number"
            name="stepInterval"
            value={formData.stepInterval}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Color de Acento</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="color"
              name="accentColor"
              value={formData.accentColor}
              onChange={handleChange}
              style={{ width: '50px', height: '40px', padding: '0', border: 'none' }}
            />
            <input
              type="text"
              name="accentColor"
              value={formData.accentColor}
              onChange={handleChange}
              style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email de Notificaciones</label>
          <input
            type="email"
            name="notifyEmail"
            value={formData.notifyEmail}
            onChange={handleChange}
            placeholder="admin@example.com"
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Zona Horaria</label>
          <select
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
          >
            <option value="America/Mexico_City">America/Mexico_City</option>
            <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{ width: '100%', padding: '12px', backgroundColor: '#00C896', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1em', cursor: 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>Error al cargar la configuración</p>}
      </form>
    </div>
  );
}
