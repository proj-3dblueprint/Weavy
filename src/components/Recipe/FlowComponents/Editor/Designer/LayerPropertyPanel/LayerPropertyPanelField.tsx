import { PanelField } from '@/UI/PanelField/PanelField';
import type { PropsWithChildren } from 'react';

type LayerPropertyPanelFieldProps = PropsWithChildren<{
  label: string;
}>;
export function LayerPropertyPanelField({ label, children }: LayerPropertyPanelFieldProps) {
  return <PanelField label={label}>{children}</PanelField>;
}
