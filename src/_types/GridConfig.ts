interface DisplayProps {
  bgColor: string;
  strokeColor?: string;
  strokeGlowColor?: string;
  strokeGlowAmount?: number;
  strokeWeight: number;
  fontColor?: string;
  lineWidth?: number;
  strokeLineWidth?: number;
}

interface AxisProps {
  fontSize?: number;
  font?: string;
  label?: string;
  textAlign?: CanvasTextAlign;
  labels?: string[];
  displayProps?: DisplayProps;
}

export interface GridConfig {
  title: string;
  grid: DisplayProps;
  xProps?: AxisProps;
  yProps?: AxisProps;
  background: DisplayProps;
  offset: number;
  fillStyle?: string;
  scale: number;
  width: number;
  height: number;
  data: DataPoint[];
}

export interface DataPoint {
  x: number;
  y: number;
}
