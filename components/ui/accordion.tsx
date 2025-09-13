import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

type AccordionContextValue = {
  type: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

interface AccordionProps {
  type: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type, value, defaultValue, onValueChange, collapsible = false, className, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === "single" ? "" : [])
    );

    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = React.useCallback((newValue: string | string[]) => {
      if (onValueChange) {
        onValueChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    }, [onValueChange]);

    return (
      <AccordionContext.Provider value={{ type, value: currentValue, onValueChange: handleValueChange, collapsible }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

const AccordionItemContext = React.createContext<string | null>(null);

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={value}>
      <div ref={ref} className={cn("border-b", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const itemValue = React.useContext(AccordionItemContext);

    if (!context || !itemValue) {
      throw new Error("AccordionTrigger must be used within AccordionItem");
    }

    const isOpen = context.type === "single" 
      ? context.value === itemValue 
      : Array.isArray(context.value) && context.value.includes(itemValue);

    const handleClick = () => {
      if (!context.onValueChange) return;

      if (context.type === "single") {
        const newValue = isOpen && context.collapsible ? "" : itemValue;
        context.onValueChange(newValue);
      } else {
        const currentArray = Array.isArray(context.value) ? context.value : [];
        const newValue = isOpen
          ? currentArray.filter(v => v !== itemValue)
          : [...currentArray, itemValue];
        context.onValueChange(newValue);
      }
    };

    return (
      <button
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const itemValue = React.useContext(AccordionItemContext);

    if (!context || !itemValue) {
      throw new Error("AccordionContent must be used within AccordionItem");
    }

    const isOpen = context.type === "single" 
      ? context.value === itemValue 
      : Array.isArray(context.value) && context.value.includes(itemValue);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
          className
        )}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };