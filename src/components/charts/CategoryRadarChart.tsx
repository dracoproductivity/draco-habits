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

  // Helper function to get category display info (name and emoji)
  // This checks for custom overrides of default categories
  const getCategoryDisplayInfo = (categoryId: string): { name: string; emoji: string } | null => {
    // First check if it's a default category
    const defaultCat = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    
    if (defaultCat) {
      // Check if there's a custom override for this default category
      const override = customCategories.find(c => c.id === `default_${categoryId}`);
      if (override) {
        return { name: override.name, emoji: override.emoji || defaultCat.emoji };
      }
      return { name: defaultCat.name, emoji: defaultCat.emoji };
    }
    
    // Check if it's a custom category (by name match or direct ID)
    const customCat = customCategories.find((c) => c.id === categoryId || c.name === categoryId);
    if (customCat) {
      return { name: customCat.name, emoji: customCat.emoji || '' };
    }
    
    return null;
  };

  const radarData = useMemo(() => {
    // Count goals per category (only used categories)
    const categoryCount: Record<string, { name: string; count: number; emoji: string }> = {};

    goals.forEach((goal) => {
      // Check for category (can be default category ID or custom category name stored as string)
      if (goal.category) {
        const displayInfo = getCategoryDisplayInfo(goal.category);
        
        if (displayInfo) {
          if (!categoryCount[goal.category]) {
            categoryCount[goal.category] = { name: displayInfo.name, count: 0, emoji: displayInfo.emoji };
          }
          categoryCount[goal.category].count++;
        } else {
          // It might be a category name stored directly (custom category)
          const customCat = customCategories.find((c) => c.name === goal.category);
          if (customCat) {
            if (!categoryCount[goal.category]) {
              categoryCount[goal.category] = { name: customCat.name, count: 0, emoji: customCat.emoji || '' };
            }
            categoryCount[goal.category].count++;
          }
        }
      }
      
      // Also check customCategoryId
      if (goal.customCategoryId) {
        const customCat = customCategories.find((c) => c.id === goal.customCategoryId);
        if (customCat) {
          if (!categoryCount[goal.customCategoryId]) {
            categoryCount[goal.customCategoryId] = { name: customCat.name, count: 0, emoji: customCat.emoji || '' };
          }
          categoryCount[goal.customCategoryId].count++;
        }
      }
    });

    return Object.entries(categoryCount)
      .filter(([_, data]) => data.count > 0) // Only categories with usage
      .map(([_, data]) => ({
        category: `${data.emoji || ''} ${data.name}`.trim(),
        value: data.count,
      }));
  }, [goals, customCategories]);

  // Calculate max value for proper grid scaling - dynamically increase based on max goals per category
  const maxValue = useMemo(() => {
    if (radarData.length === 0) return 3;
    const max = Math.max(...radarData.map(d => d.value));
    // If any category has more than 3 goals, use that as max, otherwise minimum of 3
    return Math.max(max, 3);
  }, [radarData]);

  // Generate tick values for concentric circles - one circle per level
  const gridTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = 1; i <= maxValue; i++) {
      ticks.push(i);
    }
    return ticks;
  }, [maxValue]);

  if (radarData.length === 0) {
    return (
      <div className={className}>
        <p className="text-xs text-muted-foreground text-center py-4">
          Adicione categorias aos seus objetivos para visualizar o gráfico
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

  // Custom tick component to handle long category names
  const CustomTick = ({ x, y, payload }: any) => {
    const text = payload.value || '';
    // Limit to 15 characters and add ellipsis if longer
    const displayText = text.length > 18 ? `${text.slice(0, 15)}...` : text;
    
    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--muted-foreground))"
        fontSize={compact ? 8 : 10}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {displayText}
      </text>
    );
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={compact ? 150 : 200}>
        <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <PolarGrid 
            stroke="hsl(var(--muted-foreground))" 
            strokeOpacity={0.3}
            gridType="circle"
          />
          <PolarAngleAxis
            dataKey="category"
            tick={<CustomTick />}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tickCount={maxValue + 1}
            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Objetivos"
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