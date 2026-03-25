
export interface VisAdvancedColor {
  border?: string;
  background?: string;
}

export interface VisNode {
  id: number;
  label: string;
  color: string | VisAdvancedColor;
  border?: string;
  borderWidth?: number;
  font: {
    color: string;
    background?: string;
    multi: string;
  };
  hidden?: boolean;
  shadow?: { enabled: boolean; };
}

export interface VisEdge {
  id?: string | number;
  from: number;
  to: number;
  label?: string;
  font?: {
    background: string;
  };
}
