import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useMemo } from "react";

export type SeriesInput = {
  key: string;
  data: Array<[number, number]>;
};

const palette = [
  "#38bdf8",
  "#a3e635",
  "#fbbf24",
  "#fb7185",
  "#c084fc",
  "#22c55e",
  "#60a5fa",
  "#f472b6",
];

export default function TimeSeriesChart({
  group,
  title,
  series,
  height,
}: {
  group: string;
  title: string;
  series: SeriesInput[];
  height: number;
}) {
  const option = useMemo(() => {
    const textPrimary = "rgba(15,23,42,0.92)";
    const textSecondary = "rgba(71,85,105,0.70)";
    const axisLine = "rgba(15,23,42,0.14)";
    const split = "rgba(15,23,42,0.06)";
    const tooltipBg = "rgba(255,255,255,0.92)";
    const tooltipBorder = "rgba(15,23,42,0.10)";
    const tooltipLabelBg = "rgba(15,23,42,0.75)";

    return {
      backgroundColor: "transparent",
      animation: false,
      color: palette,
      title: {
        text: title,
        left: 12,
        top: 10,
        textStyle: {
          fontFamily: "Rajdhani, system-ui",
          fontWeight: 700,
          fontSize: 12,
          color: textPrimary,
        },
      },
      grid: { left: 44, right: 18, top: 42, bottom: 34 },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: { backgroundColor: tooltipLabelBg },
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: textPrimary, fontSize: 12 },
      },
      legend: {
        type: "scroll",
        top: 8,
        right: 12,
        textStyle: {
          color: textSecondary,
          fontSize: 11,
        },
      },
      xAxis: {
        type: "time",
        axisLine: { lineStyle: { color: axisLine } },
        axisTick: { lineStyle: { color: axisLine } },
        axisLabel: { color: textSecondary },
        splitLine: { lineStyle: { color: split } },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLine: { lineStyle: { color: axisLine } },
        axisTick: { lineStyle: { color: axisLine } },
        axisLabel: { color: textSecondary },
        splitLine: { lineStyle: { color: split } },
      },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "none",
        },
        {
          type: "slider",
          xAxisIndex: 0,
          height: 18,
          bottom: 8,
          borderColor: "rgba(15,23,42,0.10)",
          backgroundColor: "rgba(15,23,42,0.03)",
          fillerColor: "rgba(59,130,246,0.15)",
          handleStyle: {
            color: "rgba(15,23,42,0.25)",
            borderColor: "rgba(15,23,42,0.2)",
          },
          textStyle: { color: textSecondary },
        },
      ],
      series: series.map((s) => ({
        name: s.key,
        type: "line",
        showSymbol: false,
        sampling: "lttb",
        lineStyle: { width: 1.6 },
        emphasis: { focus: "series" },
        data: s.data,
      })),
    };
  }, [series, title]);

  if (!series.length) {
    return (
      <div
        className="grid place-items-center rounded-2xl border border-slate-200 bg-white/60 text-xs text-slate-500"
        style={{ height }}
      >
        选择字段后开始绘制
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60">
      <ReactECharts
        echarts={echarts}
        option={option}
        notMerge={true}
        lazyUpdate={true}
        style={{ height, width: "100%" }}
        onChartReady={(chart) => {
          chart.group = group;
          echarts.connect(group);
        }}
      />
    </div>
  );
}
