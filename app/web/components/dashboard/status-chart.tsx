"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell, LabelList } from "recharts";

interface StatusChartProps {
  data: {
    status: string;
    count: number;
  }[];
}

const statusColors: Record<string, string> = {
  Pending: "hsl(45, 93%, 47%)",
  Approved: "hsl(217, 91%, 60%)",
  "In Progress": "hsl(262, 83%, 58%)",
  Completed: "hsl(142, 71%, 45%)",
};

export function StatusChart({ data }: StatusChartProps) {
  return (
    <Card className="bg-card/90 border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Issues by Status</CardTitle>
        <CardDescription className="text-xs">
          Overview of maintenance request statuses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="status" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={statusColors[entry.status] || 'hsl(var(--primary))'} 
                  />
                ))}
                <LabelList 
                  dataKey="count" 
                  position="top" 
                  style={{ 
                    fill: 'hsl(var(--foreground))', 
                    fontSize: 12, 
                    fontWeight: 600 
                  }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
