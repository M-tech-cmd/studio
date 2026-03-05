'use client';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { countries, type Country } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Input, type InputProps } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type PhoneInputProps = Omit<InputProps, 'onChange' | 'value'> & {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: 'KE';
};

const PhoneInput: React.FC<PhoneInputProps> = ({
  className,
  value: valueProp = '',
  onChange,
  defaultCountry = 'KE',
  ...props
}) => {
  const [open, setOpen] = React.useState(false);

  // Function to find the country that best matches the start of the phone number
  const findCountry = (val: string): Country | undefined => {
    if (!val) return undefined;
    // Find the longest matching dial code
    return countries.reduce((found: Country | undefined, current: Country) => {
      if (val.startsWith(current.dialCode)) {
        if (!found || current.dialCode.length > found.dialCode.length) {
          return current;
        }
      }
      return found;
    }, undefined);
  };

  // Memoize derived state to prevent unnecessary re-renders
  const [country, phoneNumber] = React.useMemo(() => {
    const selectedCountry = findCountry(valueProp);
    const countryToUse = selectedCountry ?? countries.find(c => c.code === defaultCountry)!;
    const number = valueProp.replace(countryToUse.dialCode, '');
    return [countryToUse, number];
  }, [valueProp, defaultCountry]);

  const handleCountrySelect = (selected: Country) => {
    setOpen(false);
    if (onChange) {
      // When country is changed, update the full value
      onChange(selected.dialCode + phoneNumber.replace(/\s/g, ''));
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
    if (onChange) {
      onChange(country.dialCode + digits);
    }
  };

  const formattedValue = React.useMemo(() => {
    // Only format for Kenya for now as requested
    if (country.code === 'KE') {
      const cleaned = phoneNumber.replace(/\D/g, '');
      // Format as XXX XXX XXX, up to 9 digits
      const match = cleaned.substring(0, 9).match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
      if (match) {
        return [match[1], match[2], match[3]].filter(Boolean).join(' ');
      }
    }
    return phoneNumber;
  }, [phoneNumber, country.code]);

  return (
    <div className={cn('flex items-center', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[90px] justify-between rounded-r-none"
          >
            {country.code}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                {countries.map((c) => (
                    <CommandItem
                    key={c.code}
                    value={`${c.name} (${c.code})`}
                    onSelect={() => handleCountrySelect(c)}
                    >
                    <Check
                        className={cn(
                        'mr-2 h-4 w-4',
                        country.code === c.code ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    <span className="mr-2">{c.flag}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-muted-foreground">{c.dialCode}</span>
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {country.dialCode}
        </div>
        <Input
            value={formattedValue}
            onChange={handlePhoneNumberChange}
            className="rounded-l-none"
            style={{ paddingLeft: `${country.dialCode.length * 0.6 + 1.5}rem` }}
            {...props}
        />
      </div>
    </div>
  );
};

export { PhoneInput };
