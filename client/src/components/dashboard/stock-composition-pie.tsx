import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";

interface StockCompositionPieProps {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = ['#18B2B0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function StockCompositionPie({ 
  title, 
  description, 
  data, 
  colors = DEFAULT_COLORS,
  height = 300 
}: StockCompositionPieProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">{title}</CardTitle>
          {description && <CardDescription className="text-gray-600">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
