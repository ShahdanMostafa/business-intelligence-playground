
import React from 'react';
import { FormStep } from '../types';

interface ProgressBarProps {
  currentStep: FormStep;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  const steps = [
    { label: 'Basic Info', value: FormStep.BASIC_INFO },
    { label: 'ID Upload', value: FormStep.ID_UPLOAD },
    { label: 'Verification', value: FormStep.VERIFICATION },
    { label: 'Additional', value: FormStep.ADDITIONAL_INFO },
    { label: 'Finish', value: FormStep.SUMMARY },
  ];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        {steps.map((step, index) => {
          const isActive = currentStep === step.value;
          const isCompleted = currentStep > step.value;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                  isActive
                    ? 'border-blue-600 bg-white text-blue-600 font-bold'
                    : isCompleted
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
