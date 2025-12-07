import { useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_CATEGORIES } from '@/types';

interface CategoryRadarChartProps {
  className?: string;
}

export const CategoryRadarChart = ({ className }: CategoryRadarChartProps) => {
  const { goals, habits, customCategories } = useAppStore();

  const radarData = useMemo(() => {
    // Get all categories used in goals
    const categoryUsage: Record<string, { name: string; count: number; emoji: string }> = {};

    goals.forEach(goal => {
      if (goal.category) {
        const defaultCat = DEFAULT_CATEGORIES.find(c => c.id === goal.category);
        if (defaultCat) {
          if (!categoryUsage[goal.category]) {
            categoryUsage[goal.category] = { name: defaultCat.name, count: 0, emoji: defaultCat.emoji };
          }
          categoryUsage[goal.category].count++;
        }
      }
      if (goal.customCategoryId) {
        const customCat = customCategories.find(c => c.id === goal.customCategoryId);
        if (customCat) {
          if (!categoryUsage[goal.customCategoryId]) {
            categoryUsage[goal.customCategoryId] = { name: customCat.name, count: 0, emoji: customCat.emoji || '📌' };
          }
          categoryUsage[goal.customCategoryId].count++;
        }
      }
    });

    // Convert to array and filter out unused categories
    const data = Object.entries(categoryUsage)
      .filter(([_, value]) => value.count > 0)
      .map(([key, value]) => ({
        category: `${value.emoji} ${value.name}`,
        value: value.count,
        fullMark: Math.max(...Object.values(categoryUsage).map(v => v.count), 5),
      }));

    return data;
  }, [goals, customCategories]);

  if (radarData.length < 3) {
    return (
      <div className={`flex items-center justify-center h-full text-muted-foreground text-sm ${className}`}>
        <p className="text-center">Adicione pelo menos 3 categorias<br />para ver o gráfico radar</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].payload.category}</p>
          <p className="text-xs text-muted-foreground">{payload[0].value} objetivos</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 'auto']}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Categorias"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
