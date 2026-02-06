'use client';

import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TimeSeriesDataPoint } from '@/types';

interface ChartConfig {
  dataKey: keyof TimeSeriesDataPoint;
  name: string;
  color: string;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title: string;
  chartType: 'bar' | 'line';
  configs: ChartConfig[];
  yAxisLabel?: string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
}

export default function TimeSeriesChart({
  data,
  title,
  chartType,
  configs,
  yAxisLabel,
  formatYAxis,
  formatTooltip,
}: TimeSeriesChartProps) {
  // Format date for X axis (show only day part)
  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const defaultFormatYAxis = (value: number) => String(value);
  const defaultFormatTooltip = (value: number) => String(value);

  const yFormatter = formatYAxis || defaultFormatYAxis;
  const tooltipFormatter = formatTooltip || defaultFormatTooltip;

  const commonProps = {
    data,
    margin: { top: 10, right: 30, left: 10, bottom: 10 },
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={250}>
          {chartType === 'bar' ? (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="var(--text-muted)"
                fontSize={12}
              />
              <YAxis
                tickFormatter={yFormatter}
                stroke="var(--text-muted)"
                fontSize={12}
                label={
                  yAxisLabel
                    ? {
                        value: yAxisLabel,
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: 'var(--text-muted)', fontSize: 12 },
                      }
                    : undefined
                }
              />
              <Tooltip
                formatter={(value) => [tooltipFormatter(value as number)]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              {configs.length > 1 && <Legend />}
              {configs.map((config) => (
                <Bar
                  key={config.dataKey}
                  dataKey={config.dataKey}
                  name={config.name}
                  fill={config.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="var(--text-muted)"
                fontSize={12}
              />
              <YAxis
                tickFormatter={yFormatter}
                stroke="var(--text-muted)"
                fontSize={12}
                label={
                  yAxisLabel
                    ? {
                        value: yAxisLabel,
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: 'var(--text-muted)', fontSize: 12 },
                      }
                    : undefined
                }
              />
              <Tooltip
                formatter={(value, name) => [tooltipFormatter(value as number), name]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              {configs.length > 1 && <Legend />}
              {configs.map((config) => (
                <Line
                  key={config.dataKey}
                  type="monotone"
                  dataKey={config.dataKey}
                  name={config.name}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={{ fill: config.color, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--foreground)',
  },
  chartWrapper: {
    width: '100%',
    height: 250,
  },
};
