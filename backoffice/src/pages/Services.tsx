import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api/services';
import { Service, CreateServiceInput } from '../types';
import { Layout } from '../components/Layout';
import { Button, Card, Input, Badge } from '../components/ui';
import './Services.css';

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
        <div className="services-loading">Cargando servicios...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="services-error">Error al cargar servicios</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="services">
        <header className="services-header">
          <div>
            <h1 className="page-title">Gestión de Servicios</h1>
            <p className="page-subtitle">
              Administra los servicios que ofreces a tus clientes
            </p>
          </div>
          <Button
            variant={isEditing ? 'outline' : 'primary'}
            size="md"
            onClick={isEditing ? () => setIsEditing(false) : handleCreate}
          >
            {isEditing ? 'Cancelar' : '+ Nuevo Servicio'}
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
          <div className="services-grid">
            {services.length === 0 ? (
              <Card padding="lg" className="services-empty">
                <p>No hay servicios registrados. Crea tu primer servicio.</p>
              </Card>
            ) : (
              services.map((service) => (
                <Card key={service.id} padding="lg" className="service-card">
                  <div className="service-card-header">
                    <h3 className="service-card-title">{service.name}</h3>
                    <Badge variant={service.active ? 'success' : 'error'}>
                      {service.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <div className="service-card-details">
                    <div className="service-detail">
                      <span className="service-detail-label">Duración</span>
                      <span className="service-detail-value">{service.duration} min</span>
                    </div>
                    <div className="service-detail">
                      <span className="service-detail-label">Precio</span>
                      <span className="service-detail-value">${service.price || 0}</span>
                    </div>
                    {service.buffer > 0 && (
                      <div className="service-detail">
                        <span className="service-detail-label">Buffer</span>
                        <span className="service-detail-value">{service.buffer} min</span>
                      </div>
                    )}
                  </div>

                  <div className="service-card-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
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
    <Card padding="lg" className="service-form">
      <h2 className="service-form-title">
        {service ? 'Editar Servicio' : 'Nuevo Servicio'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="service-form-grid">
          <Input
            label="Nombre del servicio"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
            placeholder="Ej: Consulta general"
          />

          <div className="service-form-row">
            <Input
              label="Duración (min)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              required
              min="1"
              fullWidth
            />
            <Input
              label="Precio ($)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              fullWidth
              min="0"
            />
          </div>

          <Input
            label="Buffer (tiempo entre citas)"
            type="number"
            value={formData.buffer}
            onChange={(e) => setFormData({ ...formData, buffer: Number(e.target.value) })}
            fullWidth
            helperText="Tiempo de descanso entre servicios en minutos"
            min="0"
          />

          <div className="service-form-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="checkbox-input"
              />
              <span>Servicio activo</span>
            </label>
          </div>
        </div>

        {mutation.error && (
          <div className="service-form-error">Error al guardar el servicio</div>
        )}

        <div className="service-form-actions">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Servicio'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
