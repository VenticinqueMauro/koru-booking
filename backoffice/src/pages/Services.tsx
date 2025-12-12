import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api/services';
import { Service, CreateServiceInput } from '../types';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Pencil, Trash2, Clock, DollarSign } from 'lucide-react';

export default function Services() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setIsEditing(true);
  };

  const services = response || [];

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
        <div className="flex h-[50vh] items-center justify-center text-destructive">
          Error al cargar servicios
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestión de Servicios</h1>
            <p className="text-muted-foreground mt-2">
              Administra los servicios que ofreces a tus clientes
            </p>
          </div>
          <Button
            variant={isEditing ? 'outline' : 'default'}
            onClick={isEditing ? () => setIsEditing(false) : handleCreate}
            className="w-full sm:w-auto"
          >
            {isEditing ? 'Cancelar' : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
              </>
            )}
          </Button>
        </header>

        {isEditing ? (
          <ServiceForm
            service={editingService}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => {
              setIsEditing(false);
              queryClient.invalidateQueries({ queryKey: ['services'] });
            }}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.length === 0 ? (
              <Card className="col-span-full py-12 text-center text-muted-foreground">
                <p>No hay servicios registrados. Crea tu primer servicio.</p>
              </Card>
            ) : (
              services.map((service) => (
                <Card key={service.id} className="flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-semibold">
                      {service.name}
                    </CardTitle>
                    <Badge variant={service.active ? 'default' : 'destructive'}>
                      {service.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 pt-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>{service.duration} min</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>{service.price || 0}</span>
                    </div>
                    {service.buffer > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="font-medium mr-2">Buffer:</span>
                        <span>{service.buffer} min</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Pencil className="mr-2 h-3 w-3" /> Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="mr-2 h-3 w-3" /> Eliminar
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function ServiceForm({ service, onCancel, onSuccess }: { service: Service | null, onCancel: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState<CreateServiceInput>({
    name: service?.name || '',
    duration: service?.duration || 30,
    price: service?.price || 0,
    buffer: service?.buffer || 0,
    active: service?.active ?? true,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateServiceInput) => {
      if (service) {
        return servicesApi.update(service.id, data);
      }
      return servicesApi.create(data);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{service ? 'Editar Servicio' : 'Nuevo Servicio'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del servicio</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ej: Consulta general"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                required
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buffer">Buffer (tiempo entre citas)</Label>
            <Input
              id="buffer"
              type="number"
              value={formData.buffer}
              onChange={(e) => setFormData({ ...formData, buffer: Number(e.target.value) })}
              min="0"
            />
            <p className="text-xs text-muted-foreground">Tiempo de descanso entre servicios en minutos</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
            />
            <Label htmlFor="active">Servicio activo</Label>
          </div>

          {mutation.error && (
            <div className="text-sm text-destructive font-medium">Error al guardar el servicio</div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mutation.isPending ? 'Guardando...' : 'Guardar Servicio'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
