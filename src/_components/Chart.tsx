/* eslint-disable @typescript-eslint/no-unused-vars */
import { CanvasProps } from '_classes/CanvasProps';
import { GridConfig } from '_types/GridConfig';
import { useCallback, useEffect, useRef, type PropsWithChildren } from 'react';
interface Props {
  config: GridConfig;
}

const factor = 3.04;
const canvasScale = 2;
export default function Chart({
  config,
  children,
  ...props
}: PropsWithChildren<Props>) {
  const canvasWrapper = useRef<CanvasProps | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const transformAmount = useRef<number>(0);
  const xStart = config.yProps?.labels ? 40 : 0;
  const spaceBefore = config.yProps?.labels
    ? config.yProps?.labels.reduce((s: number, value: string) => {
        if (value.length > s) {
          return value.length;
        }
        return s;
      }, 0)
    : 0;

  if (config.yProps?.label) {
    const length =
      config.yProps.label.length < 25 ? config.yProps.label.length : 22;
    transformAmount.current = Math.floor(length / 2) * 0.05;
  }

  const renderXGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!canvasWrapper.current) {
      return;
    }
    const inc = canvasWrapper.current.canvasScaledWidth / (10 * 2);
    let yLabel = 1;
    for (let x = inc; x < canvasWrapper.current.canvasScaledWidth; x += inc) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasWrapper.current.canvasScaledHeight);
      ctx.fillText((yLabel++).toString(), x, canvasWrapper.current.height - 30);
    }
    ctx.stroke();
  }, []);

  const renderYGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!canvasWrapper.current) {
        return;
      }
      let i = 0;
      const yLabels = config.yProps?.labels
        ? (config.yProps?.labels.length + 1) * 2
        : 22;
      const yIncrement = canvasWrapper.current.canvasScaledHeight / yLabels;
      for (
        let y = yIncrement;
        y < canvasWrapper.current.canvasScaledHeight;
        y += yIncrement
      ) {
        ctx.moveTo(xStart, y);
        ctx.lineTo(canvasWrapper.current.canvasScaledWidth, y);
        if (
          config.yProps?.labels &&
          i < config.yProps.labels.length &&
          config.yProps.labels[i]
        ) {
          const label = config.yProps.labels[i];
          if (label && label.length > 0) {
            ctx.fillText(label.padStart(spaceBefore), 0, y + 5);
          }
        }
        i++;
      }

      ctx.textAlign = config.yProps?.textAlign ?? 'center';
      ctx.strokeStyle = config.yProps?.displayProps?.strokeColor ?? 'black';
      ctx.lineWidth =
        config.yProps?.displayProps?.lineWidth ?? config.grid.lineWidth ?? 1;
      ctx.stroke();

      ctx.rect(
        xStart,
        0,
        canvasWrapper.current.canvasScaledWidth,
        canvasWrapper.current.canvasScaledHeight,
      );
      ctx.fillStyle = config.grid.bgColor;
      ctx.fillRect(
        xStart,
        0,
        canvasWrapper.current.canvasScaledWidth,
        canvasWrapper.current.canvasScaledHeight,
      );
      ctx.lineWidth =
        config.yProps?.displayProps?.lineWidth ?? config.grid.lineWidth ?? 1;
      ctx.stroke();
    },
    [
      config.grid.bgColor,
      config.grid.lineWidth,
      config.yProps?.displayProps?.lineWidth,
      config.yProps?.displayProps?.strokeColor,
      config.yProps?.labels,
      config.yProps?.textAlign,
      spaceBefore,
      xStart,
    ],
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const originalFontSize = ctx.font;
      const font =
        config.yProps?.font && config.yProps?.fontSize
          ? `${config.yProps.fontSize}px ${config.yProps.font}`
          : originalFontSize;
      ctx.font = font;
      renderXGrid(ctx);
      renderYGrid(ctx);
      ctx.font = originalFontSize;
    },
    [config.yProps?.font, config.yProps?.fontSize, renderXGrid, renderYGrid],
  );

  const plotGridPoints = useCallback(() => {
    if (!canvasWrapper.current) {
      return;
    }
    if (!canvas.current) {
      return;
    }
    let i = 0;
    const getXY = (): [number, number, number, number] => {
      if (config.data.length === 0) {
        return [0, 0, 0, 0];
      }
      const current = config.data[i];
      const next = config.data[i + 1];
      if (!current || !next) {
        return [0, 0, 0, 0];
      }
      return [current.x, current.y, next.x, next.y];
    };

    if (canvas.current.getContext('2d')) {
      const ctx = canvas.current.getContext('2d');
      if (!ctx) {
        return;
      }

      ctx.reset();
      ctx.scale(2, 2);
      drawGrid(ctx);
      if (config.data.length === 0) {
        return;
      }

      // plot grid points
      const originalFontSize = ctx.font;
      const font =
        config.xProps?.font && config.xProps?.fontSize
          ? `${config.xProps.fontSize * (config.scale / (factor + 1))}px ${
              config.xProps.font
            }`
          : originalFontSize;

      ctx.font = font;
      ctx.beginPath();

      ctx.translate(0, canvasWrapper.current.canvasScaledHeight / 4);
      ctx.moveTo(xStart, config.data[0].y);
      ctx.fillStyle = config.background.strokeColor ?? 'black';
      for (i = 1; i < config.data.length; i++) {
        const [x, y, nextX, nextY] = getXY();
        const c = (x + nextX) / 2;
        const d = (y + nextY) / 2;
        console.log(x, y, c, d);
        ctx.quadraticCurveTo(x, y, c, d);
        if (i % 100 === 0) {
          ctx.fillText(y.toString(), x, y - 10);
        }
      }
      const [x, y, nextX, nextY] = getXY();
      ctx.quadraticCurveTo(x, y, nextX, nextY);
      ctx.strokeStyle = config.background.strokeColor ?? 'black';
      ctx.lineWidth = config.grid.lineWidth ?? 1;
      ctx.shadowBlur = config.grid.strokeGlowAmount ?? 5;
      ctx.shadowColor = config.grid.strokeGlowColor ?? 'black';
      ctx.stroke();
      ctx.font = originalFontSize;
    }
  }, [
    config.background.strokeColor,
    config.data,
    config.grid.lineWidth,
    config.grid.strokeGlowAmount,
    config.grid.strokeGlowColor,
    config.scale,
    config.xProps?.font,
    config.xProps?.fontSize,
    drawGrid,
    xStart,
  ]);

  useEffect(() => {
    canvasWrapper.current = new CanvasProps(
      config.width,
      config.height,
      config.scale,
    );
    if (canvas.current) {
      canvas.current.style.width = config.yProps?.label ? '98%' : '100%';
      canvas.current.style.height = '100%';
      canvas.current.width = canvasWrapper.current.canvasScaledWidth;
      canvas.current.height = canvasWrapper.current.canvasScaledHeight;
      canvas.current.style.backgroundColor = config.grid.bgColor;
      canvas.current.style.margin = '0px';

      plotGridPoints();
    }
  }, [
    config.grid.bgColor,
    config.height,
    config.scale,
    config.width,
    config.yProps?.label,
    plotGridPoints,
  ]);

  return (
    <div className="canvas-bg">
      <div className="title">
        <h2>{config.title}</h2>
      </div>
      <div id="canvas-div">
        <div className="flex-container left-label">
          {config.yProps?.label && (
            <div
              className="y-label"
              style={{
                transform: `rotate(-90deg) translateY(-${transformAmount.current}vw)`,
              }}
            >
              {config.yProps.label.length < 25
                ? config.yProps.label
                : `${config.yProps.label.substring(0, 22)}...`}
            </div>
          )}
          <canvas className="canvas" ref={canvas} />
        </div>
        {config.xProps?.label && (
          <span className="x-label">{config.xProps.label}</span>
        )}
      </div>
      {children}
    </div>
  );
}
