import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";

const dailyData = [
  { name: 'Pirmdiena', klātesošie: 775, prombūtne: 75 },
  { name: 'Otrdiena', klātesošie: 762, prombūtne: 88 },
  { name: 'Trešdiena', klātesošie: 728, prombūtne: 122 },
  { name: 'Ceturtdiena', klātesošie: 749, prombūtne: 101 },
  { name: 'Piektdiena', klātesošie: 740, prombūtne: 110 },
];

const weeklyData = [
  { name: '1. nedēļa', klātesošie: 768, prombūtne: 82 },
  { name: '2. nedēļa', klātesošie: 757, prombūtne: 93 },
  { name: '3. nedēļa', klātesošie: 756, prombūtne: 94 },
  { name: '4. nedēļa', klātesošie: 747, prombūtne: 103 },
];

const monthlyData = [
  { name: 'Janvāris', klātesošie: 760, prombūtne: 90 },
  { name: 'Februāris', klātesošie: 755, prombūtne: 95 },
  { name: 'Marts', klātesošie: 765, prombūtne: 85 },
  { name: 'Aprīlis', klātesošie: 763, prombūtne: 87 },
  { name: 'Maijs', klātesošie: 770, prombūtne: 80 },
  { name: 'Jūnijs', klātesošie: 710, prombūtne: 140 },
];

const chartConfig = {
  klātesošie: {
    label: "Klātesošie",
    theme: {
      light: "#10b981",
      dark: "#10b981",
    },
  },
  prombūtne: {
    label: "Prombūtnē",
    theme: {
      light: "#ef4444",
      dark: "#ef4444",
    },
  },
};

export const DailyAttendanceChart = () => {
  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="aspect-[4/3]">
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="klātesošie" fill="var(--color-klātesošie)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="prombūtne" fill="var(--color-prombūtne)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const WeeklyAttendanceChart = () => {
  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="aspect-[4/3]">
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="klātesošie"
              stroke="var(--color-klātesošie)"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="prombūtne"
              stroke="var(--color-prombūtne)"
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export const MonthlyAttendanceChart = () => {
  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="aspect-[4/3]">
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="klātesošie"
              stroke="var(--color-klātesošie)"
              fill="var(--color-klātesošie)"
              fillOpacity={0.3}
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="prombūtne"
              stroke="var(--color-prombūtne)"
              fill="var(--color-prombūtne)"
              fillOpacity={0.3}
              stackId="1"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
