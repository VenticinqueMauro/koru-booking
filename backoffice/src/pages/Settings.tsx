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
      setFormData({
        layout: response.layout || 'list',
        stepInterval: response.stepInterval || 30,
        accentColor: response.accentColor || '#00C896',
        notifyEmail: response.notifyEmail || '',
        timezone: response.timezone || 'America/Mexico_City',
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stepInterval' ? Number(value) : value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, layout: value as UpdateWidgetSettingsInput['layout'] }));
  }

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

        <Card>
          <CardHeader>
            <CardTitle>Ajustes Generales</CardTitle>
            <CardDescription>Modifica la apariencia y funcionamiento de tu widget.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Apariencia</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Diseño del Widget</Label>
                    <Select
                      value={formData.layout}
                      onValueChange={handleSelectChange}
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
                    <p className="text-xs text-muted-foreground">Cómo se mostrarán los servicios en el widget.</p>
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
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuración</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stepInterval">Intervalo de Tiempo (minutos)</Label>
                    <Input
                      id="stepInterval"
                      type="number"
                      name="stepInterval"
                      value={formData.stepInterval}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground">Intervalos mostrados en la selección de hora.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Input
                      id="timezone"
                      type="text"
                      name="timezone"
                      value={formData.timezone}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Zona horaria predeterminada.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notificaciones</h3>
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
                  <p className="text-xs text-muted-foreground">Recibirás alertas de nuevas reservas aquí.</p>
                </div>
              </div>

              {error && (
                <div className="text-destructive text-sm font-medium">
                  Error al cargar la configuración
                </div>
              )}

              <div className="pt-4">
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
