'use client';

import React, { useState } from 'react';

interface TestWizardProps {
  onComplete: () => void;
}

function TestWizard({ onComplete }: TestWizardProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Test Wizard
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This is a test to isolate the import issue.
        </p>
        <button
          onClick={onComplete}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default TestWizard;
