import React from 'react';
import type { ReactElement } from 'react';
import { Controller } from 'react-hook-form';
import type { Control, FieldValues, FieldPath } from 'react-hook-form';
import { Input } from './Input';
import type { InputProps } from './Input';

export interface FormInputProps<T extends FieldValues>
  extends Omit<InputProps, 'value' | 'onChangeText' | 'error' | 'onBlur'> {
  control: Control<T>;
  name: FieldPath<T>;
}

export const FormInput = <T extends FieldValues>({
  control,
  name,
  ...inputProps
}: FormInputProps<T>): ReactElement => (
  <Controller
    control={control}
    name={name}
    render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
      <Input
        {...inputProps}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        error={error?.message}
      />
    )}
  />
);
