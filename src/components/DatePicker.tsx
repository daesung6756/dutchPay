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

  React.useEffect(() => {
    setDate(value ? new Date(value + "T00:00:00") : undefined);
  }, [value]);

  return (
    <div className="flex flex-col gap-1 ">
      <Label htmlFor={id} className="sr-only">
        날짜 선택
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id={id} className="justify-between font-normal">
            {date ? date.toISOString().slice(0, 10) : placeholder}
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
              onChange?.(d ? d.toISOString().slice(0, 10) : "");
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DatePicker;
