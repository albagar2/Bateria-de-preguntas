import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

export const ActivityChart = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            }}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              fontSize: '14px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="#4f46e5" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
            name="Preguntas"
          />
          <Area 
            type="monotone" 
            dataKey="correct" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={0} 
            name="Aciertos"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AccuracyPieChart = ({ correct, total }) => {
  const data = [
    { name: 'Aciertos', value: correct, color: '#10b981' },
    { name: 'Fallos', value: total - correct, color: '#ef4444' },
  ];

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
