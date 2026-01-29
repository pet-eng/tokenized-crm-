'use client'

import { useEffect, useState } from 'react'
import { differenceInSeconds, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'

interface CountdownTimerProps {
  targetDate: Date
  variant?: 'default' | 'compact'
  showSeconds?: boolean
}

export function CountdownTimer({ targetDate, variant = 'default', showSeconds = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (timeLeft.isPast) {
    return (
      <span className="text-destructive font-medium">
        Overdue
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span className="font-mono text-sm">
        {timeLeft.display}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {timeLeft.days > 0 && (
        <TimeBlock value={timeLeft.days} label="d" />
      )}
      {(timeLeft.days === 0 || timeLeft.days < 7) && (
        <>
          <TimeBlock value={timeLeft.hours} label="h" />
          <TimeBlock value={timeLeft.minutes} label="m" />
          {showSeconds && timeLeft.days === 0 && (
            <TimeBlock value={timeLeft.seconds} label="s" />
          )}
        </>
      )}
    </div>
  )
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="font-mono text-lg font-semibold tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function calculateTimeLeft(targetDate: Date) {
  const now = new Date()
  const isPast = targetDate < now

  if (isPast) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, display: 'Overdue' }
  }

  const totalSeconds = differenceInSeconds(targetDate, now)
  const days = differenceInDays(targetDate, now)
  const hours = differenceInHours(targetDate, now) % 24
  const minutes = differenceInMinutes(targetDate, now) % 60
  const seconds = totalSeconds % 60

  let display = ''
  if (days > 0) {
    display = `${days}d ${hours}h`
  } else if (hours > 0) {
    display = `${hours}h ${minutes}m`
  } else {
    display = `${minutes}m ${seconds}s`
  }

  return { days, hours, minutes, seconds, isPast: false, display }
}

interface ContractCountdownProps {
  endDate: Date
}

export function ContractCountdown({ endDate }: ContractCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => calculateContractTime(endDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateContractTime(endDate))
    }, 60000) // Update every minute for contracts

    return () => clearInterval(timer)
  }, [endDate])

  if (timeLeft.isPast) {
    return (
      <div className="text-destructive">
        <span className="text-2xl font-bold">Expired</span>
      </div>
    )
  }

  const urgencyClass = timeLeft.days <= 7
    ? 'text-destructive'
    : timeLeft.days <= 14
    ? 'text-orange-500'
    : 'text-foreground'

  return (
    <div className={urgencyClass}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums">{timeLeft.days}</span>
        <span className="text-sm text-muted-foreground">days</span>
        {timeLeft.days <= 7 && (
          <>
            <span className="text-xl font-semibold tabular-nums">{timeLeft.hours}</span>
            <span className="text-sm text-muted-foreground">hrs</span>
          </>
        )}
      </div>
    </div>
  )
}

function calculateContractTime(endDate: Date) {
  const now = new Date()
  const isPast = endDate < now

  if (isPast) {
    return { days: 0, hours: 0, isPast: true }
  }

  const days = differenceInDays(endDate, now)
  const hours = differenceInHours(endDate, now) % 24

  return { days, hours, isPast: false }
}
