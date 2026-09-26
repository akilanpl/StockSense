"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function SearchBar({ placeholder }: { placeholder: string }) {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  return (
    <form
      className="min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        setNotice(
          query.trim()
            ? "Search is ready in the layout, and results will appear when this module is connected."
            : "Enter a term to search once this module is connected.",
        );
      }}
    >
      <label className="relative block">
        <span className="sr-only">Search</span>
        <Icon
          name="search"
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setNotice("");
          }}
          placeholder={placeholder}
          className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      {notice ? <p className="mt-1.5 text-xs text-muted">{notice}</p> : null}
    </form>
  );
}
