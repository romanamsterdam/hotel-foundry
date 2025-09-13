import * as React from "react";
import { Circle } from "lucide-react";
import { cn } from "../../lib/utils";

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  children: React.ReactNode;
  className?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, name, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");
    
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    
    const handleValueChange = React.useCallback((newValue: string) => {
      if (onValueChange) {
        onValueChange(newValue);
      }
      if (!isControlled) {
        setInternalValue(newValue);
      }
    }, [onValueChange, isControlled]);

    return (
      <RadioGroupContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, name }}>
        <div ref={ref} className={cn("grid gap-2", className)} {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    
    if (!context) {
      throw new Error("RadioGroupItem must be used within RadioGroup");
    }

    const isChecked = context.value === value;

    return (
      <div className="flex items-center space-x-2">
        <input
          ref={ref}
          type="radio"
          className="sr-only"
          checked={isChecked}
          onChange={() => context.onValueChange?.(value)}
          name={context.name}
          value={value}
          {...props}
        />
        <button
          type="button"
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onClick={() => context.onValueChange?.(value)}
        >
          {isChecked && (
            <Circle className="h-2.5 w-2.5 fill-current text-current" />
          )}
        </button>
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };