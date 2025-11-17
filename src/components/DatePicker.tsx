"use client"

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerProps = {
  value?: string; // yyyy-mm-dd
  onChange?: (s: string) => void;
  id?: string;
  placeholder?: string;
};

export function DatePicker({ value, onChange, id, placeholder = "날짜 선택" }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value ? new Date(value + "T00:00:00") : undefined);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    setDate(value ? new Date(value + "T00:00:00") : undefined);
  }, [value]);

  React.useEffect(() => {
    function detect() {
      try {
        const coarse = typeof window !== 'undefined' && (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        const narrow = typeof window !== 'undefined' && window.innerWidth <= 480;
        setIsMobile(Boolean(coarse || narrow));
      } catch (e) {
        setIsMobile(false);
      }
    }
    detect();
    window.addEventListener('resize', detect);
    return () => { window.removeEventListener('resize', detect); };
  }, []);

  function formatLocalDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return (
    <div className="flex flex-col gap-1 ">
      <Label htmlFor={id} className="sr-only">
        날짜 선택
      </Label>
      {isMobile ? (
        // Use native date input on touch / narrow screens to leverage device picker
        <input
          id={id}
          type="date"
          className="border rounded px-3 py-2"
          value={date ? formatLocalDate(date) : ""}
          onChange={(e) => {
            const v = e.target.value; // YYYY-MM-DD
            setDate(v ? new Date(v + 'T00:00:00') : undefined);
            onChange?.(v);
          }}
          placeholder={placeholder}
        />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" id={id} className="justify-between font-normal">
              {date ? formatLocalDate(date) : placeholder}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-2" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(d) => {
                setDate(d ?? undefined);
                setOpen(false);
                onChange?.(d ? formatLocalDate(d) : "");
              }}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default DatePicker;
