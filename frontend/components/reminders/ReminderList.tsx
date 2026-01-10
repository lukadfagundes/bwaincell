"use client";

import { useReminders } from "@/hooks/useReminders";
import { ReminderCreateForm } from "./ReminderCreateForm";
import { ReminderItem } from "./ReminderItem";
import { ReminderListSkeleton } from "./ReminderSkeleton";
import { Bell } from "lucide-react";

export function ReminderList() {
  const { reminders, isLoading, createReminder, deleteReminder, isCreating } =
    useReminders();

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <ReminderCreateForm
            onCreate={createReminder}
            isCreating={isCreating}
          />
        </div>
        <ReminderListSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <ReminderCreateForm onCreate={createReminder} isCreating={isCreating} />
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No reminders yet
          </h3>
          <p className="text-muted-foreground">
            Create your first reminder to stay on track!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onDelete={deleteReminder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
