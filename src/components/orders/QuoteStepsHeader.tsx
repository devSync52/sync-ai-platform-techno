'use client';

import React from 'react';
import clsx from 'clsx';

interface QuoteStepsHeaderProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const steps = [
  { label: 'Sender', value: 'sender' },
  { label: 'Ship from', value: 'ship_from' },
  { label: 'Ship to', value: 'ship_to' },
  { label: 'Item', value: 'item' },
];

export default function QuoteStepsHeader({ currentStep, onStepClick }: QuoteStepsHeaderProps) {
  return (
    <div className="flex gap-2 pb-4">
      {steps.map((step, index) => (
        <button
          key={step.value}
          onClick={() => onStepClick(index)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition',
            currentStep === index
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          )}
        >
          <span className="bg-white text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          {step.label}
        </button>
      ))}
    </div>
  );
}

export type { QuoteStepsHeaderProps };