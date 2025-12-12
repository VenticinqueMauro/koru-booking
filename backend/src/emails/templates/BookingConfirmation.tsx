import * as React from 'react';
import {
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout.js';

interface BookingConfirmationProps {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  notes?: string;
  calendarLink: string;
}

export const BookingConfirmation = ({
  customerName,
  serviceName,
  date,
  time,
  notes,
  calendarLink,
}: BookingConfirmationProps) => {
  return (
    <EmailLayout previewText={`Reserva confirmada - ${serviceName}`}>
      <Section style={header}>
        <Heading style={headerTitle}>✅ Reserva Confirmada</Heading>
      </Section>

      <Section style={content}>
        <Text style={greeting}>
          Hola <strong>{customerName}</strong>,
        </Text>
        <Text style={paragraph}>
          Tu reserva ha sido confirmada exitosamente. Te esperamos en la fecha y hora indicadas.
        </Text>

        <Section style={detailBox}>
          <Heading style={detailBoxTitle}>Detalles de tu Reserva</Heading>

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

          {notes && (
            <Section style={detailRow}>
              <Text style={label}>Notas:</Text>
              <Text style={value}>{notes}</Text>
            </Section>
          )}
        </Section>

        <Section style={buttonContainer}>
          <Button href={calendarLink} style={button}>
            📅 Añadir a mi Calendario
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={notice}>
          Si necesitas cancelar o modificar tu reserva, por favor contáctanos lo antes posible.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default BookingConfirmation;

// Styles based on backoffice color palette
const header = {
  background: 'linear-gradient(135deg, #20B486 0%, #1a9970 100%)',
  color: '#ffffff',
  padding: '30px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
};

const headerTitle = {
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  color: '#ffffff',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '0 0 8px 8px',
};

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
  color: '#333333',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  margin: '0 0 24px',
};

const detailBox = {
  backgroundColor: '#f7f8fa',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
  borderLeft: '4px solid #20B486',
};

const detailBoxTitle = {
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
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#20B486',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '16px',
  display: 'inline-block',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const notice = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};
