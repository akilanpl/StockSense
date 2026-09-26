"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProfileForm() {
  const [notice, setNotice] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setNotice("Profile changes are not saved in this phase.");
      }}
    >
      <Input name="name" label="Name" placeholder="Your name" autoComplete="name" />
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="you@company.com"
        autoComplete="email"
      />
      <Input name="role" label="Role" placeholder="Role is assigned later" disabled />
      {notice ? <p className="text-xs text-muted">{notice}</p> : null}
      <Button type="submit">Save profile</Button>
    </form>
  );
}
