'use client';

import React, { useState } from 'react';
import { FormStepProps, BasicInfo } from '@/types/preferences';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const BasicInfoStep: React.FC<FormStepProps<BasicInfo>> = ({
  data,
  updateData,
  onNext,
  isLast
}) => {
  const [formData, setFormData] = useState<BasicInfo>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof BasicInfo | string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BasicInfo] as Record<string, string>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.nationality.trim()) newErrors.nationality = 'Nationality is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.emergencyContact.name.trim()) newErrors.emergencyName = 'Emergency contact name is required';
    if (!formData.emergencyContact.phone.trim()) newErrors.emergencyPhone = 'Emergency contact phone is required';
    if (!formData.emergencyContact.relationship.trim()) newErrors.emergencyRelationship = 'Emergency contact relationship is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      updateData(formData);
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-400">Let&apos;s start with your basic details for a personalized travel experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Enter your first name"
            required
          />
        </div>
        <div>
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            error={errors.dateOfBirth}
            required
          />
        </div>
        <div>
          <Input
            label="Nationality"
            value={formData.nationality}
            onChange={(e) => handleChange('nationality', e.target.value)}
            error={errors.nationality}
            placeholder="e.g., American, British, etc."
            required
          />
        </div>
      </div>

      <div>
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          placeholder="+1 (555) 123-4567"
          required
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emergency Contact</h3>
        
        <div className="space-y-4">
          <Input
            label="Contact Name"
            value={formData.emergencyContact.name}
            onChange={(e) => handleChange('emergencyContact.name', e.target.value)}
            error={errors.emergencyName}
            placeholder="Full name of emergency contact"
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Contact Phone"
              type="tel"
              value={formData.emergencyContact.phone}
              onChange={(e) => handleChange('emergencyContact.phone', e.target.value)}
              error={errors.emergencyPhone}
              placeholder="+1 (555) 123-4567"
              required
            />
            <Input
              label="Relationship"
              value={formData.emergencyContact.relationship}
              onChange={(e) => handleChange('emergencyContact.relationship', e.target.value)}
              error={errors.emergencyRelationship}
              placeholder="e.g., Spouse, Parent, Sibling"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <div>
          {/* Empty div for spacing */}
        </div>
        <Button onClick={handleNext}>
          {isLast ? 'Complete' : 'Next Step'}
        </Button>
      </div>
    </div>
  );
};
