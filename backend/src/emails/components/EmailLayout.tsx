import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
} from '@react-email/components';

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
}

export const EmailLayout = ({ children, previewText }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      {previewText && (
        <Text
          style={{
            display: 'none',
            overflow: 'hidden',
            lineHeight: '1px',
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          {previewText}
        </Text>
      )}
      <Body style={main}>
        <Container style={container}>{children}</Container>
        <Section style={footer}>
          <Text style={footerText}>
            Gracias por confiar en nosotros
          </Text>
          <Text style={footerSubtext}>
            Este es un email automático, por favor no respondas a esta dirección.
          </Text>
        </Section>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f7f8fa',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
  color: '#666666',
};

const footerText = {
  fontSize: '14px',
  marginBottom: '8px',
};

const footerSubtext = {
  fontSize: '12px',
  color: '#999999',
  margin: '0',
};
