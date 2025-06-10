
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface CalendarioFaturamentoProps {
  porPeriodo: { data: string; valor: number }[];
  onDateRangeChange: (inicio?: Date, fim?: Date) => void;
}

export const CalendarioFaturamento = ({ porPeriodo, onDateRangeChange }: CalendarioFaturamentoProps) => {
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();

  const handleDateChange = (inicio?: Date, fim?: Date) => {
    setDataInicio(inicio);
    setDataFim(fim);
    onDateRangeChange(inicio, fim);
  };

  const limparFiltro = () => {
    handleDateChange();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Preparar dados para o gráfico
  const chartData = porPeriodo.map(item => ({
    data: format(new Date(item.data), 'dd/MM', { locale: ptBR }),
    valor: item.valor,
    dataCompleta: item.data
  })).slice(-14); // Últimos 14 dias

  const chartConfig = {
    valor: {
      label: "Faturamento",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Faturamento por Período</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dataInicio && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataInicio ? format(dataInicio, "PPP", { locale: ptBR }) : "Data início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataInicio}
                onSelect={(date) => handleDateChange(date, dataFim)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dataFim && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataFim ? format(dataFim, "PPP", { locale: ptBR }) : "Data fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataFim}
                onSelect={(date) => handleDateChange(dataInicio, date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {(dataInicio || dataFim) && (
            <Button variant="outline" onClick={limparFiltro}>
              Limpar filtro
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="data" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => [formatCurrency(Number(value)), "Faturamento"]}
                    />
                  } 
                />
                <Bar dataKey="valor" fill="hsl(var(--chart-1))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhum dado para o período selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
};
