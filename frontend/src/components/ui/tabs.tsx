"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onValueChange, className }: TabsProps) {
  const tablistRef = useRef<HTMLDivElement>(null);

  const focusTab = (index: number) => {
    const tablist = tablistRef.current;
    if (!tablist) return;
    const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    if (tabs.length === 0) return;
    const target = tabs[(index + tabs.length) % tabs.length];
    target.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tablist = tablistRef.current;
    if (!tablist) return;
    const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    if (currentIndex === -1) return;

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTab(currentIndex + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTab(currentIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(tabs.length - 1);
        break;
    }
  };

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cn("flex gap-1 border-b border-border", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`tab-${item.value}`}
            aria-selected={active}
            aria-controls={`panel-${item.value}`}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            onFocus={() => onValueChange(item.value)}
            className={cn(
              "border-b-2 -mb-px px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-slate-500 hover:border-border-strong hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabContent({
  value,
  activeValue,
  children,
  className,
}: {
  value: string;
  activeValue: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      id={`panel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      hidden={value !== activeValue}
      className={cn(className)}
    >
      {children}
    </div>
  );
}