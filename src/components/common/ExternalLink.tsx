import type { ReactNode } from 'react';
import { z } from 'zod';
import { useTranslation } from '../../i18n/useTranslation';
import { Icon } from './Icon';

const safeExternalUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === 'https:', 'Only HTTPS links are allowed.');

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function ExternalLink({ href, children, className = '' }: ExternalLinkProps) {
  const { t } = useTranslation();
  const parsed = safeExternalUrl.safeParse(href);

  if (!parsed.success) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      className={className}
      href={parsed.data}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${String(children)} — ${t('common.opensNewTab')}`}
    >
      {children}
      <Icon name="external" className="ml-1 inline h-4 w-4" />
    </a>
  );
}
