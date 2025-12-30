import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '../api/settings';
import { UpdateWidgetSettingsInput } from '../types';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateWidgetSettingsInput>({
    // Apariencia
    layout: 'list',
    accentColor: '#00C896',
    // Modo de visualización
    displayMode: 'modal',
    triggerText: 'Reservar',
    triggerPosition: 'bottom-right',
    offsetX: 24,
    offsetY: 24,
    // Configuración
    stepInterval: 30,
    timezone: 'America/Argentina/Buenos_Aires',
    // Notificaciones
    notifyEmail: '',
  });

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  useEffect(() => {
    if (response) {
      setFormData({
        layout: response.layout || 'list',
        accentColor: response.accentColor || '#00C896',
        displayMode: response.displayMode || 'modal',
        triggerText: response.triggerText || 'Reservar',
        triggerPosition: response.triggerPosition || 'bottom-right',
        offsetX: response.offsetX ?? 24,
        offsetY: response.offsetY ?? 24,
        stepInterval: response.stepInterval || 30,
        timezone: response.timezone || 'America/Argentina/Buenos_Aires',
        notifyEmail: response.notifyEmail || '',
      });
    }
  }, [response]);

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configuración guardada correctamente');
    },
    onError: () => {
      toast.error('Error al guardar la configuración');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: keyof UpdateWidgetSettingsInput, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
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

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuración del Widget</h1>
          <p className="text-muted-foreground mt-2">
            Personaliza el aspecto y comportamiento del widget de reservas
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Apariencia */}
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Personaliza el estilo visual del widget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Diseño de Servicios</Label>
                  <Select
                    value={formData.layout}
                    onValueChange={(value) => handleSelectChange('layout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un diseño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">Lista</SelectItem>
                      <SelectItem value="grid">Cuadrícula</SelectItem>
                      <SelectItem value="button">Botón</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Cómo se mostrarán los servicios</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Color de Acento</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      id="accentColor"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modo de Visualización */}
          <Card>
            <CardHeader>
              <CardTitle>Modo de Visualización</CardTitle>
              <CardDescription>Configura cómo se muestra el widget en tu sitio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modo</Label>
                  <Select
                    value={formData.displayMode}
                    onValueChange={(value) => handleSelectChange('displayMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona modo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modal">Modal (botón flotante)</SelectItem>
                      <SelectItem value="inline">Embebido (en página)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Modal muestra un botón flotante, Embebido se integra directamente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggerText">Texto del Botón</Label>
                  <Input
                    id="triggerText"
                    type="text"
                    name="triggerText"
                    value={formData.triggerText}
                    onChange={handleChange}
                    placeholder="Reservar"
                    disabled={formData.displayMode === 'inline'}
                  />
                  <p className="text-xs text-muted-foreground">Texto del botón flotante (solo modo modal)</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Posición del Botón</Label>
                  <Select
                    value={formData.triggerPosition}
                    onValueChange={(value) => handleSelectChange('triggerPosition', value)}
                    disabled={formData.displayMode === 'inline'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Posición" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Abajo derecha</SelectItem>
                      <SelectItem value="bottom-left">Abajo izquierda</SelectItem>
                      <SelectItem value="top-right">Arriba derecha</SelectItem>
                      <SelectItem value="top-left">Arriba izquierda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offsetX">Margen Horizontal (px)</Label>
                  <Input
                    id="offsetX"
                    type="number"
                    name="offsetX"
                    value={formData.offsetX}
                    onChange={handleChange}
                    min={0}
                    max={200}
                    disabled={formData.displayMode === 'inline'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offsetY">Margen Vertical (px)</Label>
                  <Input
                    id="offsetY"
                    type="number"
                    name="offsetY"
                    value={formData.offsetY}
                    onChange={handleChange}
                    min={0}
                    max={200}
                    disabled={formData.displayMode === 'inline'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Ajustes de funcionamiento del widget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stepInterval">Intervalo de Tiempo (minutos)</Label>
                  <Input
                    id="stepInterval"
                    type="number"
                    name="stepInterval"
                    value={formData.stepInterval}
                    onChange={handleChange}
                    min={5}
                    max={120}
                  />
                  <p className="text-xs text-muted-foreground">Intervalos mostrados en la selección de hora</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => handleSelectChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona zona horaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</SelectItem>
                      <SelectItem value="America/Mexico_City">México (Ciudad de México)</SelectItem>
                      <SelectItem value="America/Santiago">Chile (Santiago)</SelectItem>
                      <SelectItem value="America/Bogota">Colombia (Bogotá)</SelectItem>
                      <SelectItem value="America/Lima">Perú (Lima)</SelectItem>
                      <SelectItem value="Europe/Madrid">España (Madrid)</SelectItem>
                      <SelectItem value="America/New_York">Estados Unidos (Nueva York)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Estados Unidos (Los Ángeles)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Zona horaria para los horarios de reserva</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Configura las alertas de nuevas reservas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="notifyEmail">Email de Notificaciones</Label>
                <Input
                  id="notifyEmail"
                  type="email"
                  name="notifyEmail"
                  value={formData.notifyEmail}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                />
                <p className="text-xs text-muted-foreground">Recibirás alertas de nuevas reservas aquí</p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="text-destructive text-sm font-medium">
              Error al cargar la configuración
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
