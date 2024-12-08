'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Play, Pause, ChevronRight, ChevronLeft, Calendar, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, Area, AreaChart } from 'recharts'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useSearchParams } from 'next/navigation'
import getColorByScore from '../../../utils/colors'
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700'],
});

const CustomTooltip = ({ 
  active, 
  payload, 
  setCurrentPage, 
  setExpandedCards, 
  recordsPerPage 
}: { 
  active?: boolean;
  payload?: any[];
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setExpandedCards: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  recordsPerPage: number;
}) => {
  console.log('Tooltip triggered:', { active, payload });
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const callNumber = parseInt(data.name) + 1;
    console.log('Showing tooltip for call:', callNumber);
    return (
      <div 
        onClick={() => {
          const targetPage = Math.ceil(callNumber / recordsPerPage);
          setCurrentPage(targetPage);

          setTimeout(() => {
            const element = document.getElementById(`call-${callNumber}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
              setExpandedCards((prev: Record<number, boolean>) => ({
                ...prev,
                [callNumber]: true
              }));
            }
          }, 0);
        }}
        className="bg-[#1c1c1c] p-3 rounded-lg shadow-lg min-w-[140px] cursor-pointer hover:bg-[#2c2c2c] transition-colors"
      >
        <p className="text-white text-lg">Call {callNumber} - {data.value}/100</p>
      </div>
    );
  }
  return null;
};

interface CategoryScores {
  engagement: number;
  objection_handling: number;
  information_gathering: number;
  program_explanation: number;
  closing_skills: number;
  overall_effectiveness: number;
  overall_performance?: number;
  average_success: number;
}

interface CategoryFeedback {
  engagement: string;
  objection_handling: string;
  information_gathering: string;
  program_explanation: string;
  closing_skills: string;
  overall_effectiveness: string;
}

interface CallLog {
  id: number;
  call_number: number;
  user_name: string;
  user_picture_url: string;
  agent_name: string;
  agent_picture_url: string;
  call_date: string;
  call_recording_url: string;
  call_details: string;
  call_duration: number;
  power_moment: string;
  call_notes: string;
  level_up_1: string;
  level_up_2: string;
  level_up_3: string;
  call_transcript: string;
  strong_points: string;
  areas_for_improvement: string;
  scores: CategoryScores;
  feedback: CategoryFeedback;
}

type CategoryKey = 'engagement' | 'objection_handling' | 'information_gathering' | 'program_explanation' | 'closing_skills' | 'overall_effectiveness';

type DateRange = {
  from: Date;
  to: Date;
} | null;

type Category = {
  key: CategoryKey;
  label: string;
  description?: string;
}

type CategoryScore = {
  engagement: number;
  objection_handling: number;
  information_gathering: number;
  program_explanation: number;
  closing_skills: number;
  overall_effectiveness: number;
}

type ChartData = {
  name: string;
  date: string;
  value?: number;
} & Partial<CategoryScore>

type ChartProps = {
  data: Array<ChartData>;
  category?: Category;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  setExpandedCards: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  recordsPerPage: number;
}

const Chart = ({ data, category, dateRange, setDateRange, setExpandedCards, setCurrentPage, recordsPerPage }: ChartProps) => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  if (!data.length) {
    return (
      <Card className="relative overflow-hidden border-0 bg-white rounded-[32px] shadow-lg h-[400px] flex items-center justify-center">
        <div className="text-slate-500">No data available</div>
      </Card>
    );
  }

  const filterByDateRange = (date: string) => {
    if (!dateRange) return true;
    const itemDate = new Date(date);
    const fromDate = new Date(dateRange.from.setHours(0, 0, 0, 0));
    const toDate = new Date(dateRange.to.setHours(23, 59, 59, 999));
    return itemDate >= fromDate && itemDate <= toDate;
  };

  const chartData = React.useMemo(() => {
    return data
      .filter(item => filterByDateRange(item.date))
      .map(item => ({
        name: item.name,
        value: category ? (item[category.key as keyof CategoryScore] ?? 0) : (item.value ?? 0)
      }));
  }, [data, dateRange, category]);

  const average = React.useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, item) => acc + (item.value || 0), 0);
    return sum / chartData.length;
  }, [chartData]);

  const color = getColorByScore(average);

  const noDataContent = (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
      <div className="text-lg">No data</div>
      <div className="text-sm mt-1">for selected time period</div>
    </div>
  );

  return (
    <Card className="relative overflow-hidden border-0 bg-white rounded-[32px] shadow-lg [&>*:last-child]:overflow-visible">
      <div className="flex justify-between items-center p-6">
        <span className="text-slate-900 text-xl font-semibold">
          {category ? category.label : 'Average Success'}
        </span>
      </div>
      <CardContent className="p-0">
        {chartData.length === 0 ? noDataContent : (
          <div className="h-[320px] relative -mx-8 -mb-8 overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
             <AreaChart 
  data={chartData} 
  margin={{ top: 16, right: 16, bottom: -48, left: -48 }}
  onMouseMove={(state) => {
    if (state?.activeTooltipIndex !== undefined) {
      setActiveTooltip(state.activeTooltipIndex);
    }
  }}
  onMouseLeave={() => setActiveTooltip(null)}
>
                <defs>
                  <linearGradient id={`colorGradient-${category ? category.key : 'overall'}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={false}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={false}
                  domain={[0, 100]} 
                />
               <Tooltip 
  active={true}
  wrapperStyle={{ zIndex: 100 }}
  content={(props) => (
    <CustomTooltip 
      {...props} 
      setCurrentPage={setCurrentPage} 
      setExpandedCards={setExpandedCards} 
      recordsPerPage={recordsPerPage} 
    />
  )}
  cursor={{
    stroke: '#666',
    strokeWidth: 1,
    strokeDasharray: '4 4'
  }}
/>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#colorGradient-${category ? category.key : 'overall'})`}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: color,
                    stroke: "white",
                    strokeWidth: 2,
                    className: "drop-shadow-md"
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[64px] font-bold tracking-tight" style={{ color: getColorByScore(average) }}>
                {Math.round(average)}/100
              </div>
              <div className="text-lg text-slate-600 mt-1">Average Score</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AudioPlayer = ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioData = () => {
      setDuration(audio.duration)
      setCurrentTime(audio.currentTime)
    }

    const setAudioTime = () => setCurrentTime(audio.currentTime)

    audio.addEventListener('loadeddata', setAudioData)
    audio.addEventListener('timeupdate', setAudioTime)

    return () => {
      audio.removeEventListener('loadeddata', setAudioData)
      audio.removeEventListener('timeupdate', setAudioTime)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSliderChange = (newValue: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const [newTime] = newValue
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full space-y-1.5">
      <audio ref={audioRef} src={src} />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={togglePlayPause}
          className="h-8 w-8 rounded-full p-0 hover:bg-slate-100"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={handleSliderChange}
          className="flex-grow"
          aria-label="Audio progress"
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

const DatePicker = ({ onChange }: { onChange: (range: DateRange) => void }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  
  const firstMonth = currentDate
  const secondMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
  
  const renderMonth = (date: Date) => {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => null)

    return (
      <div className="space-y-4">
        <div className="text-xl font-semibold">
          {format(date, "MMMM yyyy")}
        </div>
        <div className="grid grid-cols-7 gap-2 text-sm">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-slate-500">
              {day}
            </div>
          ))}
          {[...paddingDays, ...days].map((day, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-9 w-9 p-0 font-normal ${
                day === null
                  ? "invisible"
                  : "text-slate-900"
              } ${
                day === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()
                  ? "border border-slate-200"
                  : ""
              }`}
              onClick={() => {
                if (day !== null) {
                  const selectedDate = new Date(date.getFullYear(), date.getMonth(), day)
                  onChange({
                    from: selectedDate,
                    to: selectedDate
                  })
                }
              }}
            >
              {day}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const presets = [
    {
      label: "This Week",
      getValue: () => ({
        from: startOfWeek(new Date()),
        to: endOfWeek(new Date())
      })
    },
    {
      label: "Last Week",
      getValue: () => ({
        from: startOfWeek(subDays(new Date(), 7)),
        to: endOfWeek(subDays(new Date(), 7))
      })
    },
    {
      label: "Last 7 Days",
      getValue: () => ({
        from: subDays(new Date(), 7),
        to: new Date()
      })
    },
    {
      label: "This Month",
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      label: "Last 14 Days",
      getValue: () => ({
        from: subDays(new Date(), 14),
        to: new Date()
      })
    },
    {
      label: "Last 30 Days",
      getValue: () => ({
        from: subDays(new Date(), 30),
        to: new Date()
      })
    }
  ]

  return (
    <Card className="p-4 space-y-4">
      <Button 
        variant="outline" 
        className="w-full justify-center text-center h-10 px-4 py-2"
        onClick={() => onChange(null)}
      >
        All time
      </Button>
      
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-transparent"
          onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <div className="grid grid-cols-2 gap-8">
          {renderMonth(firstMonth)}
          {renderMonth(secondMonth)}
        </div>
        <Button
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-transparent"
          onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            className="justify-center"
            onClick={() => onChange(preset.getValue())}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </Card>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [dateRange, setDateRange] = useState<DateRange>(null)
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [savedStates, setSavedStates] = useState<Record<number, boolean>>({});
  const recordsPerPage = 5
  const [playCallModal, setPlayCallModal] = useState<{ isOpen: boolean; callId: number | null }>({ isOpen: false, callId: null })
  const [detailsModal, setDetailsModal] = useState<{ 
    isOpen: boolean; 
    call: CallLog | null 
  }>({ isOpen: false, call: null })
  const [callNotes, setCallNotes] = useState<Record<number, string>>({})
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleError = (error: unknown) => {
    setError(error instanceof Error ? error.message : 'An error occurred')
    setIsLoading(false)
  }

  useEffect(() => {
  const fetchCalls = async () => {
    const memberId = searchParams.get('memberId')
    if (!memberId) {
      setError('No member ID provided')
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      console.log('Fetching data for memberId:', memberId);
      const response = await fetch(`/api/dashboard?memberId=${memberId}`)
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json()
      console.log('Received data:', {
        count: data.length,
        sample: data[0] ? { ...data[0], call_transcript: '[truncated]' } : 'No data'
      });
      
      if (!Array.isArray(data)) {
        console.error('Invalid data format:', data);
        throw new Error('Invalid data format received from server');
      }
      
      setCallLogs(data)
      setError(null)
    } catch (error) {
      console.error('Dashboard Error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      setError(error instanceof Error ? error.message : 'Failed to load calls')
    } finally {
      setIsLoading(false)
    }
  }

  fetchCalls()
}, [searchParams])

  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = [...callLogs]
    .reverse()
    .slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(callLogs.length / recordsPerPage)

  const scoreCategories: Category[] = [
    { key: 'engagement', label: 'Engagement', description: 'Measures how well the agent connects with the customer and keeps them interested throughout the call.' },
    { key: 'objection_handling', label: 'Objection Handling', description: 'Evaluates the agent\'s ability to address and overcome customer concerns or objections.' },
    { key: 'information_gathering', label: 'Information Gathering', description: 'Assesses how effectively the agent collects relevant information from the customer.' },
    { key: 'program_explanation', label: 'Program Explanation', description: 'Rates the clarity and completeness of the agent\'s explanation of products or services.' },
    { key: 'closing_skills', label: 'Closing Skills', description: 'Measures the agent\'s ability to guide the conversation towards a successful conclusion or sale.' },
    { key: 'overall_effectiveness', label: 'Overall Effectiveness', description: 'A comprehensive score reflecting the agent\'s overall performance during the call.' },
  ]

  const chartData = React.useMemo(() => callLogs.map((call, index) => ({
  name: `${index + 1}`,
  date: call.call_date,
  engagement: call.scores.engagement,
  objection_handling: call.scores.objection_handling,
  information_gathering: call.scores.information_gathering,
  program_explanation: call.scores.program_explanation,
  closing_skills: call.scores.closing_skills,
  overall_effectiveness: call.scores.overall_effectiveness
})), [callLogs]);

 const averageSuccessData = React.useMemo(() => callLogs.map((call, index) => ({
  name: `${index + 1}`,
  date: call.call_date,
  value: call.scores.overall_effectiveness
})), [callLogs]);

  const toggleExpandCard = useCallback((id: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }, [])

  // With these:
const handleNotesChange = (id: number, notes: string) => {
  setCallNotes(prev => ({
    ...prev,
    [id]: notes
  }))
}

const saveNotes = async (id: number) => {
  try {
    const response = await fetch(`/api/dashboard?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        call_notes: callNotes[id]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save notes');
    }

    setCallLogs(prevLogs => 
      prevLogs.map(log => 
        log.id === id 
          ? { ...log, call_notes: callNotes[id] } 
          : log
      )
    );

    // Set saved state for this specific note
    setSavedStates(prev => ({ ...prev, [id]: true }));

    // Reset after 3 seconds
    setTimeout(() => {
      setSavedStates(prev => ({ ...prev, [id]: false }));
    }, 3000);

  } catch (error) {
    console.error('Error saving notes:', error);
  }
}

  if (error) {
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white shadow-lg rounded-[32px] overflow-hidden border-0">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Dashboard</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="bg-slate-100 p-4 rounded-xl overflow-auto text-sm">
                {JSON.stringify(error, null, 2)}
              </pre>
            )}
            <Button 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

  if (isLoading) {
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-[400px] bg-white rounded-[32px] shadow-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[300px] bg-white rounded-[32px] shadow-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

  if (!callLogs.length) {
    return <div className="flex items-center justify-center min-h-screen">No call data found</div>
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <h2 className={`${montserrat.className} text-3xl mb-6 text-slate-900 text-center flex items-center justify-center gap-2`}>
          <img 
            src="https://cdn.prod.website-files.com/6715d8211d464cb83a0c72a1/67528b819edc014ecbcce383_Purple%20increase%20icon.png" 
            alt="Charts icon" 
            className="w-8 h-8"
          />
          Charts
        </h2>
        <div className="flex justify-end mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white border-slate-200 text-slate-900 hover:bg-slate-50 h-9 px-4 py-2 text-sm font-medium rounded-full shadow-sm"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="bg-white border border-slate-200 p-0 shadow-lg rounded-xl w-auto" 
              align="end" 
              sideOffset={8}
            >
              <DatePicker onChange={setDateRange} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="mb-8">
  <Chart 
    data={averageSuccessData} 
    dateRange={dateRange} 
    setDateRange={setDateRange}
    setExpandedCards={setExpandedCards}
    setCurrentPage={setCurrentPage}
    recordsPerPage={recordsPerPage}
  />
</div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {scoreCategories.map((category) => (
            <div key={category.key}>
              <Chart 
  data={chartData} 
  category={category} 
  dateRange={dateRange} 
  setDateRange={setDateRange}
  setExpandedCards={setExpandedCards}
  setCurrentPage={setCurrentPage}
  recordsPerPage={recordsPerPage}
/>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-bold mb-6 text-slate-900 text-center">
          CALL RECORDS
        </h2>
        <div className="space-y-6">
          {currentRecords.map((call, index) => (
            <Card key={call.id} className="bg-white shadow-lg rounded-[32px] overflow-hidden border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-start mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <img
  src={call.agent_picture_url || "/placeholder.svg?height=48&width=48"}
  alt={`${call.agent_name}'s profile`}
  className="rounded-full w-12 h-12 bg-slate-100"
/>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{call.agent_name}</p>
                      <h2 className="text-2xl font-bold text-slate-900">
                        Call #{callLogs.length - (indexOfFirstRecord + index)}
                      </h2>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-slate-600">
                      {new Date(call.call_date).toLocaleString('en-US', {
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm font-medium text-slate-700 mt-1">
                      Call duration: {call.call_duration} minutes
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  {scoreCategories.map((category) => {
    const score = call.scores[category.key];
    const color = getColorByScore(score);
    return (
      <Popover key={category.key}>
        <PopoverTrigger asChild>
          <div className="relative overflow-hidden rounded-xl cursor-pointer" style={{ backgroundColor: `${color}20` }}>
            <div className="px-4 py-3 text-sm font-medium flex flex-col justify-between h-full items-center text-center">
              <span className="text-slate-600">{category.label}</span>
              <div className="flex items-center gap-1">
                <div className="text-2xl font-bold" style={{ color: getColorByScore(score) }}>
                  {score}/100
                </div>
                <Info className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
            <div 
              className="absolute bottom-0 left-0 h-1 transition-all duration-300"
              style={{ 
                width: `${score}%`,
                backgroundColor: color
              }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 rounded-[20px] p-4 bg-white border shadow-lg">
          <h3 className="text-lg font-semibold mb-2">{category.label}</h3>
          <p className="text-sm text-slate-600">
            {call.feedback[category.key] || category.description || 'No feedback available'}
          </p>
        </PopoverContent>
      </Popover>
    );
  })}
</div>

                {/* Toggle Button */}
<Button
  variant="ghost"
  className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-full mt-4 rounded-xl"
  onClick={() => toggleExpandCard(call.id)}
>
  {expandedCards[call.id] ? (
    <>
      Hide Details <ChevronUp className="ml-2 h-4 w-4" />
    </>
  ) : (
    <>
      Call Details <ChevronDown className="ml-2 h-4 w-4" />
    </>
  )}
</Button>

{/* Expandable Content */}
<div className={`transition-all duration-300 ease-in-out overflow-hidden ${
  expandedCards[call.id] 
    ? 'max-h-[5000px] opacity-100 mt-6' 
    : 'max-h-0 opacity-0 mt-0'
}`}>
  <div className="p-6 bg-white rounded-[32px] shadow-sm">
    <h3 className="text-2xl font-bold text-slate-900 mb-4">Call Details</h3>
    <div className="space-y-6">
      {/* Power Moment and Notes Section */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="relative overflow-hidden border-0 bg-white rounded-[32px] shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">⚡ Power Moment!</h3>
            <p className="text-white p-4 rounded-xl" style={{ backgroundColor: 'rgba(91, 6, 190, 0.5)' }}>
              {call.power_moment || "No power moment recorded"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-white rounded-[32px] shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Call Notes</h3>
            <Textarea
              placeholder="Enter your notes here..."
              value={callNotes[call.id] ?? call.call_notes}
              onChange={(e) => handleNotesChange(call.id, e.target.value)}
              className="min-h-[100px] mb-2 rounded-[20px]"
            />
            <Button 
              onClick={() => saveNotes(call.id)}
              className="w-full rounded-[20px]"
            >
              {savedStates[call.id] ? "Saved!" : "Save Notes"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Analysis and Level Up Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Analysis Card */}
        <Card className="relative overflow-hidden border-0 bg-white rounded-[32px] shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-900 text-xl font-semibold">Detailed Analysis</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-600">Overall Score</span>
                <span className="text-2xl font-bold" style={{ color: getColorByScore(call.scores.average_success) }}>
                  {call.scores.average_success}/100
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${call.scores.average_success}%`,
                    backgroundColor: getColorByScore(call.scores.average_success)
                  }}
                />
              </div>
              <p className="text-slate-600">
                {call.call_details || "No detailed analysis available"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Level Up Plan Card */}
        <Card className="relative overflow-hidden border-0 bg-white rounded-[32px] shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-900 text-xl font-semibold">Level Up Plan</span>
            </div>
            <div className="space-y-4">
              {(!call.level_up_1 && !call.level_up_2 && !call.level_up_3) ? (
                <div className="bg-[#fef8e8] text-slate-800 p-4 rounded-xl flex items-center gap-2">
                  No Plan
                </div>
              ) : (
                <>
                  {call.level_up_1 && (
                    <div className="bg-[#fef8e8] text-slate-800 p-4 rounded-xl flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 15L9 9L13 13L20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {call.level_up_1}
                    </div>
                  )}
                  {call.level_up_2 && (
                    <div className="bg-[#fef8e8] text-slate-800 p-4 rounded-xl flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 15L9 9L13 13L20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {call.level_up_2}
                    </div>
                  )}
                  {call.level_up_3 && (
                    <div className="bg-[#fef8e8] text-slate-800 p-4 rounded-xl flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 15L9 9L13 13L20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {call.level_up_3}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Recording Section */}
      <Card className="relative overflow-hidden border-0 bg-white rounded-[32px] shadow-lg w-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-900 text-xl font-semibold">Call Recording</span>
          </div>
          <AudioPlayer src={call.call_recording_url} />
        </CardContent>
      </Card>

      {/* Call Transcript Section */}
      <Card className="relative overflow-hidden border-0 bg-white rounded-[32px] shadow-lg w-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-900 text-xl font-semibold">Call Transcript</span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            {call.call_transcript.split('role:').map((segment, index) => {
              if (!segment.trim()) return null;
              
              const [roleType, ...messageParts] = segment.split('message:');
              if (!messageParts.length) return null;

              const isBot = roleType.trim() === 'bot';
              const message = messageParts.join('message:').trim();
              
              return (
                <div 
                  key={index}
                  className="p-3 rounded-lg"
                  style={{ 
                    backgroundColor: isBot 
                      ? 'rgba(248, 185, 34, 0.1)'
                      : 'rgba(91, 6, 190, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6">
                      <img
                        src={isBot ? call.agent_picture_url : call.user_picture_url || '/placeholder.svg?height=24&width=24'}
                        alt={`${isBot ? call.agent_name : call.user_name}'s avatar`}
                        className="w-full h-full rounded-[20px]"
                      />
                    </div>
                    <span className="text-sm" style={{ color: '#000' }}>
                      {isBot ? call.agent_name : call.user_name}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#000' }}>
                    {message}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 p-6 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="h-10 w-10 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className={`h-10 w-10 rounded-full ${
                currentPage === page
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "text-slate-900 hover:bg-slate-100"
              }`}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="h-10 w-10 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
