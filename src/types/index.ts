export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

export type SelectOption = {
  value: string;
  label: string;
};

export type FilterDefinition = {
  id: string;
  label: string;
  options: SelectOption[];
};

export type FormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
};

export type DetailField = {
  label: string;
  hint: string;
};

export type StatusLegendItem = {
  label: string;
  tone: StatusTone;
};
