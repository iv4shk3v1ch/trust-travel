'use client';

import React, { useState } from 'react';
import { FormStepProps, Budget } from '@/types/preferences';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN',
  'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'TRY', 'ZAR'
];

const BUDGET_PRIORITIES = [
  'Accommodation', 'Food & Dining', 'Transportation', 'Activities & Tours',
  'Shopping', 'Entertainment', 'Insurance', 'Emergency Fund', 'Souvenirs',
  'Photography', 'Local Experiences', 'Comfort & Convenience'
];

const PAYMENT_METHODS = [
  'Credit Card', 'Debit Card', 'Cash', 'Digital Wallet (PayPal, Apple Pay, etc.)',
  'Traveler\'s Checks', 'Prepaid Travel Card', 'Bank Transfer', 'Cryptocurrency'
];

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required
}) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  description?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  selected,
  onChange,
  description
}) => {
  const handleChange = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => handleChange(option)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const BudgetStep: React.FC<FormStepProps<Budget>> = ({
  data,
  updateData,
  onNext,
  onPrevious,
  isLast
}) => {
  const [formData, setFormData] = useState<Budget>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBudgetChange = (field: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      dailyBudget: {
        ...prev.dailyBudget,
        [field]: numValue
      }
    }));
  };

  const handleCurrencyChange = (currency: string) => {
    setFormData(prev => ({
      ...prev,
      currency
    }));
  };

  const handleCheckboxChange = (field: keyof Budget, selected: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: selected
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currency) {
      newErrors.currency = 'Please select a currency';
    }

    if (formData.dailyBudget.min <= 0) {
      newErrors.minBudget = 'Minimum budget must be greater than 0';
    }

    if (formData.dailyBudget.max <= 0) {
      newErrors.maxBudget = 'Maximum budget must be greater than 0';
    }

    if (formData.dailyBudget.min >= formData.dailyBudget.max) {
      newErrors.budgetRange = 'Maximum budget must be greater than minimum budget';
    }

    if (formData.budgetPriorities.length === 0) {
      newErrors.priorities = 'Please select at least one budget priority';
    }

    if (formData.paymentMethods.length === 0) {
      newErrors.payment = 'Please select at least one payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      updateData(formData);
      onNext();
    }
  };

  const handlePrevious = () => {
    updateData(formData);
    if (onPrevious) onPrevious();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Budget & Payment</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Help us recommend destinations and experiences that fit your budget.
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Budget Tip:</strong> Your budget information helps us recommend destinations, accommodations, 
              and activities that match your financial comfort zone. You can always adjust these later.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Select
          label="Currency"
          value={formData.currency}
          onChange={handleCurrencyChange}
          options={CURRENCIES}
          placeholder="Select currency"
          error={errors.currency}
          required
        />
        <Input
          label="Minimum Daily Budget"
          type="number"
          value={formData.dailyBudget.min.toString()}
          onChange={(e) => handleBudgetChange('min', e.target.value)}
          error={errors.minBudget}
          placeholder="50"
          required
        />
        <Input
          label="Maximum Daily Budget"
          type="number"
          value={formData.dailyBudget.max.toString()}
          onChange={(e) => handleBudgetChange('max', e.target.value)}
          error={errors.maxBudget || errors.budgetRange}
          placeholder="200"
          required
        />
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>
          <strong>Daily budget includes:</strong> accommodation, meals, local transportation, and activities per person.
          International flights and travel insurance are typically separate.
        </p>
      </div>

      <CheckboxGroup
        label="Budget Priorities"
        description="What are your spending priorities when traveling? (Select all that apply)"
        options={BUDGET_PRIORITIES}
        selected={formData.budgetPriorities}
        onChange={(selected) => handleCheckboxChange('budgetPriorities', selected)}
      />
      {errors.priorities && <p className="text-sm text-red-600 -mt-2">{errors.priorities}</p>}

      <CheckboxGroup
        label="Preferred Payment Methods"
        description="How do you prefer to pay while traveling?"
        options={PAYMENT_METHODS}
        selected={formData.paymentMethods}
        onChange={(selected) => handleCheckboxChange('paymentMethods', selected)}
      />
      {errors.payment && <p className="text-sm text-red-600 -mt-2">{errors.payment}</p>}

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={handlePrevious}>
          Previous
        </Button>
        <Button onClick={handleNext}>
          {isLast ? 'Complete Setup' : 'Next Step'}
        </Button>
      </div>
    </div>
  );
};
