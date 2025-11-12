import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";

interface TrendLineChartProps {
  title: string;
  description?: string;
  data: Array<{ name: string; [key: string]: any }>;
  dataKeys: Array<{ key: string; color: string; name: string }>;
  height?: number;
}

export function TrendLineChart({ 
  title, 
  description, 
  data, 
  dataKeys,
  height = 300 
}: TrendLineChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="col-span-full lg:col-span-2 bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">{title}</CardTitle>
          {description && <CardDescription className="text-gray-600">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs" 
                tick={{ fill: 'currentColor' }}
              />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              {dataKeys.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  stroke={item.color}
                  name={item.name}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
