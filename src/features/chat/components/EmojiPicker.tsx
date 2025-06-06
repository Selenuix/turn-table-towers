import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 text-slate-400 hover:text-slate-300",
          isOpen && "text-slate-300"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Smile className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <Picker
            data={data}
            onEmojiSelect={(emoji: any) => {
              onEmojiSelect(emoji.native);
              setIsOpen(false);
            }}
            theme="dark"
            set="native"
            categories={[
              'frequent',
              'smileys',
              'people',
              'nature',
              'foods',
              'activity',
              'places',
              'objects',
              'symbols',
              'flags'
            ]}
            showPreview={true}
            showSkinTones={true}
            emojiSize={20}
            perLine={8}
            locale="en"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
