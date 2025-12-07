import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { UpdateWidgetSettingsInput, WidgetSettings } from '../types';
import { Layout } from '../components/Layout';
import { Card, Button, Input } from '../components/ui';
import './Settings.css';

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

  if (isLoading) {
    return (
      <Layout>
        <div className="settings-loading">Cargando configuración...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="settings">
        <header className="page-header">
          <h1 className="page-title">Configuración del Widget</h1>
          <p className="page-subtitle">
            Personaliza el aspecto y comportamiento del widget de reservas
          </p>
        </header>

        <Card padding="lg" className="settings-form-card">
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="settings-form-section">
              <h3 className="settings-section-title">Apariencia</h3>

              <div className="settings-form-grid">
                <div className="settings-form-field">
                  <label className="settings-label">Diseño del Widget</label>
                  <select
                    name="layout"
                    value={formData.layout}
                    onChange={handleChange}
                    className="settings-select"
                  >
                    <option value="list">Lista</option>
                    <option value="grid">Cuadrícula</option>
                    <option value="compact">Compacto</option>
                  </select>
                </div>

                <div className="settings-form-field">
                  <label className="settings-label">Color de Acento</label>
                  <div className="settings-color-picker">
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="settings-color-input"
                    />
                    <input
                      type="text"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="settings-color-text"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-form-section">
              <h3 className="settings-section-title">Configuración</h3>

              <div className="settings-form-grid">
                <Input
                  label="Intervalo de Tiempo (minutos)"
                  type="number"
                  name="stepInterval"
                  value={formData.stepInterval}
                  onChange={handleChange}
                  fullWidth
                  helperText="Intervalos en los que se mostrarán los horarios disponibles"
                />

                <Input
                  label="Zona Horaria"
                  type="text"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  fullWidth
                  disabled
                  helperText="Zona horaria para las reservas"
                />
              </div>
            </div>

            <div className="settings-form-section">
              <h3 className="settings-section-title">Notificaciones</h3>

              <Input
                label="Email de Notificaciones"
                type="email"
                name="notifyEmail"
                value={formData.notifyEmail}
                onChange={handleChange}
                placeholder="admin@example.com"
                fullWidth
                helperText="Recibirás notificaciones cuando se realicen nuevas reservas"
              />
            </div>

            {error && (
              <div className="settings-error">
                Error al cargar la configuración
              </div>
            )}

            <div className="settings-form-actions">
              <Button
                type="submit"
                variant="primary"
                isLoading={mutation.isPending}
                fullWidth
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
