import * as React from 'react';
import {
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout.js';

interface AdminNotificationProps {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
}

export const AdminNotification = ({
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  date,
  time,
  notes,
}: AdminNotificationProps) => {
  return (
    <EmailLayout previewText={`Nueva reserva: ${serviceName} - ${customerName}`}>
      <Section style={header}>
        <Heading style={headerTitle}>🔔 Nueva Reserva Recibida</Heading>
      </Section>

      <Section style={content}>
        <Text style={intro}>
          Se ha registrado una nueva reserva en el sistema.
        </Text>

        <Section style={detailBox}>
          <Heading style={sectionTitle}>📋 Información del Servicio</Heading>

          <Section style={detailRow}>
            <Text style={label}>Servicio:</Text>
            <Text style={value}>{serviceName}</Text>
          </Section>

          <Section style={detailRow}>
            <Text style={label}>Fecha:</Text>
            <Text style={value}>{date}</Text>
          </Section>

          <Section style={detailRow}>
            <Text style={label}>Hora:</Text>
            <Text style={value}>{time}</Text>
          </Section>
        </Section>

        <Hr style={divider} />

        <Section style={detailBox}>
          <Heading style={sectionTitle}>👤 Información del Cliente</Heading>

          <Section style={detailRow}>
            <Text style={label}>Nombre:</Text>
            <Text style={value}>{customerName}</Text>
          </Section>

          <Section style={detailRow}>
            <Text style={label}>Email:</Text>
            <Text style={valueLink}>
              <a href={`mailto:${customerEmail}`} style={link}>
                {customerEmail}
              </a>
            </Text>
          </Section>

          {customerPhone && (
            <Section style={detailRow}>
              <Text style={label}>Teléfono:</Text>
              <Text style={valueLink}>
                <a href={`tel:${customerPhone}`} style={link}>
                  {customerPhone}
                </a>
              </Text>
            </Section>
          )}

          {notes && (
            <>
              <Hr style={divider} />
              <Section style={notesSection}>
                <Text style={label}>📝 Notas adicionales:</Text>
                <Text style={notesText}>{notes}</Text>
              </Section>
            </>
          )}
        </Section>

        <Section style={alertBox}>
          <Text style={alertText}>
            💡 Revisa el panel de administración para gestionar esta reserva.
          </Text>
        </Section>
      </Section>
    </EmailLayout>
  );
};

export default AdminNotification;

// Styles based on backoffice color palette
const header = {
  background: 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)',
  color: '#ffffff',
  padding: '30px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
};

const headerTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  color: '#ffffff',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '0 0 8px 8px',
};

const intro = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  marginBottom: '24px',
  marginTop: '0',
};

const detailBox = {
  backgroundColor: '#f7f8fa',
  padding: '20px',
  borderRadius: '8px',
  margin: '16px 0',
  border: '1px solid #e5e7eb',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '16px',
  color: '#333333',
};

const detailRow = {
  padding: '10px 0',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'space-between',
};

const label = {
  fontWeight: 'bold',
  color: '#666666',
  fontSize: '14px',
  margin: '0',
  display: 'inline-block',
};

const value = {
  color: '#1a1a1a',
  fontSize: '14px',
  margin: '0',
  display: 'inline-block',
  fontWeight: '500',
};

const valueLink = {
  color: '#20B486',
  fontSize: '14px',
  margin: '0',
  display: 'inline-block',
};

const link = {
  color: '#20B486',
  textDecoration: 'underline',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const notesSection = {
  marginTop: '12px',
};

const notesText = {
  backgroundColor: '#ffffff',
  padding: '12px',
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  color: '#333333',
  lineHeight: '20px',
  fontStyle: 'italic',
  marginTop: '8px',
};

const alertBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '24px',
};

const alertText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
  textAlign: 'center' as const,
};
