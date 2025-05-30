"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = ({ children, value, onValueChange, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")

  const handleValueChange = (newValue) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }

  return (
    <div className="relative" {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          isOpen,
          setIsOpen,
          selectedValue,
          onValueChange: handleValueChange,
        }),
      )}
    </div>
  )
}

const SelectTrigger = React.forwardRef(({ className, children, isOpen, setIsOpen, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    onClick={() => setIsOpen?.(!isOpen)}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, selectedValue }) => (
  <span className={selectedValue ? "" : "text-muted-foreground"}>{selectedValue || placeholder}</span>
)

const SelectContent = ({ className, children, isOpen, ...props }) => {
  if (!isOpen) return null

  return (
    <div
      className={cn(
        "absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const SelectItem = ({ className, children, value, onValueChange, selectedValue, ...props }) => (
  <div
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
      className,
    )}
    onClick={() => onValueChange?.(value)}
    {...props}
  >
    {selectedValue === value && (
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Check className="h-4 w-4" />
      </span>
    )}
    {children}
  </div>
)

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
