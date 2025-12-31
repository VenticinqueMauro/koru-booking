// SVG Icon System for Koru Booking Widget

export const icons = {
  clock: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 4V8L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,

  dollar: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2V14M5 5.5C5 4.67157 5.67157 4 6.5 4H9.5C10.3284 4 11 4.67157 11 5.5C11 6.32843 10.3284 7 9.5 7H6.5C5.67157 7 5 7.67157 5 8.5C5 9.32843 5.67157 10 6.5 10H9.5C10.3284 10 11 10.6716 11 11.5C11 12.3284 10.3284 13 9.5 13H6.5C5.67157 13 5 12.3284 5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,

  calendar: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M2.5 6.5H15.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M5.5 2V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M12.5 2V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,

  checkCircle: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
      <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  arrowLeft: `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  sparkles: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L11 8L10 14L9 8L10 2Z" fill="currentColor"/>
      <path d="M18 10L12 11L6 10L12 9L18 10Z" fill="currentColor"/>
      <path d="M15 5L12 8L9 5L12 2L15 5Z" fill="currentColor" opacity="0.6"/>
      <path d="M15 15L12 12L9 15L12 18L15 15Z" fill="currentColor" opacity="0.6"/>
    </svg>
  `,

  user: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M3 15C3 12.2386 5.23858 10 8 10H10C12.7614 10 15 12.2386 15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,

  mail: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="4.5" width="13" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M3 6L9 10L15 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,

  phone: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 2H7.5C7.77614 2 8 2.22386 8 2.5V5.5C8 5.77614 7.77614 6 7.5 6H5C4.44772 6 4 6.44772 4 7V7C4 10.866 7.13401 14 11 14V14C11.5523 14 12 13.5523 12 13V10.5C12 10.2239 12.2239 10 12.5 10H15.5C15.7761 10 16 10.2239 16 10.5V12.5C16 13.8807 14.8807 15 13.5 15H13C7.47715 15 3 10.5228 3 5V4.5C3 3.11929 4.11929 2 5.5 2Z" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,

  note: `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 6H13M5 9H13M5 12H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="3.5" y="2.5" width="11" height="13" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,

  'chevron-right': `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
};

export function getIcon(name: keyof typeof icons, className?: string): string {
  const icon = icons[name] || '';
  if (className && icon) {
    return icon.replace('<svg', `<svg class="${className}"`);
  }
  return icon;
}
