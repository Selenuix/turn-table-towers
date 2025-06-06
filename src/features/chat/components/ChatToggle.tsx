import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ChatToggle({ isOpen, onToggle, className }: ChatToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        "fixed right-4 bottom-4 h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg",
        isOpen && "hidden",
        className
      )}
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
} 