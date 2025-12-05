import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api/services';
import { Service, CreateServiceInput } from '../types';

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

  if (isLoading) return <div>Cargando servicios...</div>;
  if (error) return <div>Error al cargar servicios</div>;

  /* Lint Fix: ID: de2c606a-078a-465c-8fa6-d9e215b9b3c9 */
  const services = response || [];

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🛠️ Gestión de Servicios</h1>
        <button
          onClick={handleCreate}
          style={{ padding: '10px 20px', backgroundColor: '#00C896', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isEditing ? 'Cancelar' : 'Nuevo Servicio'}
        </button>
      </div>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {services.map((service) => (
            <div key={service.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h3 style={{ marginTop: 0 }}>{service.name}</h3>
                <span style={{
                  backgroundColor: service.active ? '#e6fffa' : '#fff5f5',
                  color: service.active ? '#047857' : '#c53030',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.8em'
                }}>
                  {service.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p>⏱️ {service.duration} mins | 💵 ${service.price || 0}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  onClick={() => handleEdit(service)}
                  style={{ padding: '5px 10px', cursor: 'pointer' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#fff5f5', color: '#c53030', border: '1px solid #c53030' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h2>{service ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Nombre</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Duración (min)</label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            required
            min="1"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Precio ($)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Buffer (tiempo entre citas en min)</label>
        <input
          type="number"
          value={formData.buffer}
          onChange={(e) => setFormData({ ...formData, buffer: Number(e.target.value) })}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          />
          Activo
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
        <button
          type="submit"
          disabled={mutation.isPending}
          style={{ padding: '10px 20px', backgroundColor: '#00C896', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
      {mutation.error && <p style={{ color: 'red' }}>Error al guardar</p>}
    </form>
  );
}
