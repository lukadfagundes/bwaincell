"use client";

import { useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Task {
  id: number;
  userId: string;
  guildId: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TaskItemProps {
  task: Task;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete: (id: number) => void;
}

export function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState(task.dueDate || "");

  const handleToggleComplete = () => {
    onUpdate(task.id, { completed: !task.completed });
  };

  const handleEdit = () => {
    onUpdate(task.id, { description, dueDate: dueDate || null });
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    onDelete(task.id);
    setIsDeleteOpen(false);
  };

  const isOverdue =
    task.dueDate && !task.completed && isPast(parseISO(task.dueDate));

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-[#f59e0b] transition-colors">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          className="data-[state=checked]:bg-[#f59e0b] data-[state=checked]:border-[#f59e0b]"
        />

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
          >
            {task.description}
          </p>
          {task.dueDate && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              <p
                className={`text-xs ${
                  isOverdue
                    ? "text-red-600 font-medium"
                    : task.completed
                      ? "text-muted-foreground/70"
                      : "text-muted-foreground"
                }`}
              >
                {format(parseISO(task.dueDate), "MMM d, yyyy")}
                {isOverdue && " (Overdue)"}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="hover:bg-accent"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update your task details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              className="bg-[#f59e0b] hover:bg-[#e08c00]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
