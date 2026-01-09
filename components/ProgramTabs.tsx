"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Program } from "@/lib/types";

interface ProgramTabsProps {
  activeProgram: Program;
  onProgramChange: (program: Program) => void;
}

export function ProgramTabs({ activeProgram, onProgramChange }: ProgramTabsProps) {
  return (
    <Tabs value={activeProgram} onValueChange={(v) => onProgramChange(v as Program)}>
      <TabsList className="grid w-full max-w-[280px] grid-cols-2">
        <TabsTrigger 
          value="HRT"
          className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
        >
          HRT
        </TabsTrigger>
        <TabsTrigger 
          value="TRT"
          className="data-[state=active]:bg-sky-600 data-[state=active]:text-white"
        >
          TRT
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

