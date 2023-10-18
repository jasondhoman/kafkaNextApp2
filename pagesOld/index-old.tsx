/* eslint-disable @typescript-eslint/no-unused-vars */
import { trpc } from '../utils/trpc';
import { useCallback, useEffect, useRef, useState } from 'react';
import Chart from '_components/Chart';
import { DataPoint, type GridConfig } from '_types/GridConfig';

const CHART_SCALE = 2;
const Y_AXIS_POINTS = 22;

export default function KafkaPage() {
  const webSocketEstablished = useRef(false);
  const authenticated = useRef(false);
  const ws = useRef<WebSocket | null>(null);
  const id = useRef<string>('');

  const [messagesRecieved, setMessagesRecieved] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    title: 'Realtime DAC Data',
    background: {
      bgColor: '#fff',
      strokeColor: 'rgb(0 100 131)',
      strokeGlowAmount: 10,
      strokeGlowColor: 'rgb(0 100 131)',
      strokeWeight: 3,
    },
    grid: {
      bgColor: '#e2e2e2',
      strokeColor: '#a2a2a2',
      strokeWeight: 1,
      strokeLineWidth: 3,
    },
    xProps: {
      fontSize: 18,
      font: 'Arial',
      label: 'Something Here',
      displayProps: {
        bgColor: '#fff',
        strokeColor: 'rgb(0 100 131)',
        fontColor: 'red',
        strokeWeight: 1,
        lineWidth: 2,
      },
    },
    yProps: {
      fontSize: 18,
      font: 'Arial',
      label: 'AMP',
      labels: [
        '10',
        '9',
        '8',
        '7',
        '6',
        '5',
        '4',
        '3',
        '2',
        '1',
        '0',
        '-1',
        '-2',
        '-3',
        '-4',
        '-5',
        '-6',
        '-7',
        '-8',
        '-9',
        '-10',
      ],
      displayProps: {
        bgColor: '#e2e2e2',
        strokeColor: '#a2a2a2',
        fontColor: 'red',
        strokeWeight: 1,
        lineWidth: 2,
      },
    },
    offset: 10,
    scale: 5,
    width: 800,
    height: 200,
    data: [],
  });

  const xStart = gridConfig.yProps?.labels ? 40 : 0;
  const xScaler = (gridConfig.width * gridConfig.scale) / 1000;

  const plotXYPoints = useCallback(
    (x: number, y: number) => {
      const scalingFactor =
        (gridConfig.height * gridConfig.scale) / CHART_SCALE / Y_AXIS_POINTS;
      const offset = y >= 0 ? -1 : 1;
      const height = Math.floor(y * scalingFactor * offset);
      return {
        x: x * xScaler + xStart,
        y: y < 0 ? Math.floor(height) * -1 : Math.floor(height),
      };
    },
    [gridConfig.height, gridConfig.scale, xScaler, xStart],
  ) as (x: number, y: number) => DataPoint;

  const logEvent = useCallback(
    (str: string) => {
      setLog((prev) => [...prev, str]);
      if (log.length > 20) {
        setLog((prev) => prev.slice(1));
      }
    },
    [log.length],
  );

  const establishWebSocket = useCallback(() => {
    if (webSocketEstablished.current) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    const [host, port] = window.location.host.split(':');
    ws.current = new WebSocket(`${protocol}://${host}:3002/kafka`);
    // ws.current = new WebSocket(`ws://localhost:3005/stream-events`);
    ws.current.addEventListener('open', () => {
      webSocketEstablished.current = true;
      logEvent('WebSocket connection established');
    });

    ws.current.addEventListener('close', () => {
      webSocketEstablished.current = false;
      authenticated.current = false;
      logEvent('WebSocket connection closed');
    });

    ws.current.addEventListener('message', (event) => {
      try {
        console.log('message', event.data);
        if (!authenticated.current) {
          authenticated.current = true;
          id.current = event.data as string;
        } else {
          const data = JSON.parse(event.data as string) as number[];
          if (data) {
            setMessagesRecieved((prev) => prev + 1);
            setGridConfig((prev) => ({
              ...prev,
              data: [
                ...data.map((y: number, index: number) =>
                  plotXYPoints(index, y),
                ),
              ],
            }));
            logEvent(`Message recieved: ${data.length}`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    });
  }, [logEvent, plotXYPoints]);

  const closeWebSocket = useCallback(() => {
    if (!webSocketEstablished.current) {
      return;
    }
    if (!ws.current) {
      return;
    }
    ws.current.close();
    webSocketEstablished.current = false;
    authenticated.current = false;
  }, []);

  // useEffect(() => {
  //   const pointArr: number[] = [];
  //   let amp = 0.01;
  //   while (pointArr.length < 1000) {
  //     pointArr.push(amp);
  //     amp += 0.01;
  //     if (amp > 10) amp = -10;
  //   }

  //   gridConfig.data = [...pointArr.map((y, index) => plotXYPoints(index, y))];
  //   console.log(gridConfig.data);
  // }, [gridConfig, plotXYPoints]);

  return (
    <div>
      <Chart config={gridConfig} />
      <div>
        <button className="btn btn-secondary m-3" onClick={closeWebSocket}>
          Close WebSocket
        </button>
        <button className="btn btn-primary" onClick={establishWebSocket}>
          Open WebSocket
        </button>
      </div>
      <div>
        <h2>Log</h2>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            maxHeight: '60vh',
            overflowY: 'scroll',
          }}
        >
          {log.map((str, index) => (
            <li key={index}>{str}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
