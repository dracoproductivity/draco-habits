import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_CATEGORIES } from '@/types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CategoryRadarChartProps {
  className?: string;
  compact?: boolean;
}

export const CategoryRadarChart = ({ className, compact = false }: CategoryRadarChartProps) => {
  const { goals, habits, customCategories } = useAppStore();

  const radarData = useMemo(() => {
    // Count goals per category (only used categories)
    const categoryCount: Record<string, { name: string; count: number; emoji?: string }> = {};

    goals.forEach((goal) => {
      if (goal.category) {
        const defaultCat = DEFAULT_CATEGORIES.find((c) => c.id === goal.category);
        if (defaultCat) {
          if (!categoryCount[goal.category]) {
            categoryCount[goal.category] = { name: defaultCat.name, count: 0, emoji: defaultCat.emoji };
          }
          categoryCount[goal.category].count++;
        }
      }
      if (goal.customCategoryId) {
        const customCat = customCategories.find((c) => c.id === goal.customCategoryId);
        if (customCat) {
          if (!categoryCount[goal.customCategoryId]) {
            categoryCount[goal.customCategoryId] = { name: customCat.name, count: 0, emoji: customCat.emoji };
          }
          categoryCount[goal.customCategoryId].count++;
        }
      }
    });

    // Also count habits without goals but with categories
    habits.forEach((habit) => {
      if (habit.goalId) {
        const linkedGoal = goals.find((g) => g.id === habit.goalId);
        if (linkedGoal?.category) {
          const defaultCat = DEFAULT_CATEGORIES.find((c) => c.id === linkedGoal.category);
          if (defaultCat && categoryCount[linkedGoal.category]) {
            // Already counted via goal
          }
        }
      }
    });

    return Object.entries(categoryCount)
      .filter(([_, data]) => data.count > 0) // Only categories with usage
      .map(([_, data]) => ({
        category: `${data.emoji || ''} ${data.name}`.trim(),
        value: data.count,
      }));
  }, [goals, habits, customCategories]);

  if (radarData.length < 3) {
    return (
      <div className={className}>
        <p className="text-xs text-muted-foreground text-center py-4">
          Adicione pelo menos 3 categorias para visualizar o gráfico de radar
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{payload[0].payload.category}</p>
          <p className="text-sm font-semibold text-foreground">{payload[0].value} objetivos</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={compact ? 150 : 200}>
        <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: compact ? 8 : 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 'auto']}
            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Objetivos"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};