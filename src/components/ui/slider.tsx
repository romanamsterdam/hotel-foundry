import * as React from "react";
import { cn } from "../../lib/utils";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, defaultValue = [0], onValueChange, max = 100, min = 0, step = 1, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number[]>(defaultValue);
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (index: number, newValue: number) => {
      const updatedValue = [...currentValue];
      updatedValue[index] = newValue;
      
      if (onValueChange) {
        onValueChange(updatedValue);
      } else {
        setInternalValue(updatedValue);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div 
            className="absolute h-full bg-primary"
            style={{
              left: `${((currentValue[0] - min) / (max - min)) * 100}%`,
              width: currentValue.length > 1 
                ? `${((currentValue[1] - currentValue[0]) / (max - min)) * 100}%`
                : `${((currentValue[0] - min) / (max - min)) * 100}%`
            }}
          />
        </div>
        {currentValue.map((val, index) => (
          <input
            key={index}
            type="range"
            min={min}
            max={max}
            step={step}
            value={val}
            onChange={(e) => handleChange(index, Number(e.target.value))}
            className="absolute h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:focus-visible:outline-none [&::-webkit-slider-thumb]:focus-visible:ring-2 [&::-webkit-slider-thumb]:focus-visible:ring-ring [&::-webkit-slider-thumb]:focus-visible:ring-offset-2 [&::-webkit-slider-thumb]:disabled:pointer-events-none [&::-webkit-slider-thumb]:disabled:opacity-50"
          />
        ))}
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };