"use client";

import { Check, Circle, AlertTriangle } from "lucide-react";
import {
  WORKFLOW_DEAL_PHASES,
  WORKFLOW_PHASE_LABELS,
  type WorkflowPhase,
} from "@/types/workflow";
import { cn } from "@/lib/utils";

interface WorkflowStepperProps {
  currentPhase: WorkflowPhase;
}

const PHASE_INDEX_MAP: Record<string, number> = {};
WORKFLOW_DEAL_PHASES.forEach((p, i) => {
  PHASE_INDEX_MAP[p] = i;
});

export function WorkflowStepper({ currentPhase }: WorkflowStepperProps) {
  const isTerminal = currentPhase === "completed" || currentPhase === "cancelled" || currentPhase === "disputed";
  const currentIndex = isTerminal
    ? WORKFLOW_DEAL_PHASES.length
    : (PHASE_INDEX_MAP[currentPhase] ?? 0);

  return (
    <div className="w-full">
      {/* Desktop horizontal stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
        {/* Progress line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-emerald-500 transition-all duration-500"
          style={{
            width: `${(currentIndex / (WORKFLOW_DEAL_PHASES.length - 1)) * 100}%`,
          }}
        />

        {WORKFLOW_DEAL_PHASES.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = phase === currentPhase;
          const isFuture = index > currentIndex;

          return (
            <div
              key={phase}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isCompleted && "bg-emerald-500 text-white",
                  isCurrent && "bg-blue-500 text-white ring-4 ring-blue-500/20",
                  isFuture && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 text-center max-w-[80px]",
                  isCurrent && "font-semibold text-foreground",
                  isFuture && "text-muted-foreground",
                  isCompleted && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {WORKFLOW_PHASE_LABELS[phase]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical stepper */}
      <div className="md:hidden space-y-2">
        {WORKFLOW_DEAL_PHASES.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = phase === currentPhase;

          return (
            <div key={phase} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0",
                  isCompleted && "bg-emerald-500 text-white",
                  isCurrent && "bg-blue-500 text-white",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isCurrent && "font-semibold",
                  !isCurrent && !isCompleted && "text-muted-foreground"
                )}
              >
                {WORKFLOW_PHASE_LABELS[phase]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terminal state banner */}
      {isTerminal && (
        <div
          className={cn(
            "mt-4 p-3 rounded-lg flex items-center gap-2 text-sm",
            currentPhase === "completed" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            currentPhase === "disputed" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            currentPhase === "cancelled" && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
          )}
        >
          {currentPhase === "completed" && <Check className="h-4 w-4" />}
          {currentPhase === "disputed" && <AlertTriangle className="h-4 w-4" />}
          {currentPhase === "cancelled" && <Circle className="h-4 w-4" />}
          <span className="font-medium">
            Deal {WORKFLOW_PHASE_LABELS[currentPhase]}
          </span>
        </div>
      )}
    </div>
  );
}
