export interface EmojiItem {
  emoji: string;
  label: string;
}

export interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  items: EmojiItem[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'animals',
    name: 'animals',
    icon: '🐾',
    items: [
      { emoji: '🐸', label: 'a very jumpy frog' },
      { emoji: '🦫', label: 'chompy beaver' },
      { emoji: '🐙', label: 'eight-armed weirdo' },
      { emoji: '🦦', label: 'slippery otter' },
      { emoji: '🐻', label: 'big fluffy bear' },
      { emoji: '🐧', label: 'fancy tuxedo bird' },
      { emoji: '🦄', label: 'magical horse' },
      { emoji: '🐊', label: 'snappy crocodile' },
      { emoji: '🦩', label: 'one-legged flamingo' },
      { emoji: '🐿️', label: 'cheeky chipmunk' },
      { emoji: '🦭', label: 'clapping seal' },
      { emoji: '🐝', label: 'very busy bee' },
    ],
  },
  {
    id: 'food',
    name: 'food',
    icon: '🍕',
    items: [
      { emoji: '🍕', label: 'supreme pizza' },
      { emoji: '🌮', label: 'crunchy taco' },
      { emoji: '🍦', label: 'melting ice cream' },
      { emoji: '🥞', label: 'tall pancake stack' },
      { emoji: '🍩', label: 'sprinkly donut' },
      { emoji: '🥑', label: 'mushy green blob' },
      { emoji: '🍣', label: 'fancy raw fish' },
      { emoji: '🧀', label: 'stinky cheese' },
      { emoji: '🌭', label: 'tubey hot dog' },
      { emoji: '🍜', label: 'slurpy noodles' },
      { emoji: '🧇', label: 'square waffle' },
      { emoji: '🍉', label: 'giant watermelon' },
    ],
  },
  {
    id: 'actions',
    name: 'actions',
    icon: '🏃',
    items: [
      { emoji: '🏃', label: 'ran really fast' },
      { emoji: '💤', label: 'fell right asleep' },
      { emoji: '🤸', label: 'did a cartwheel' },
      { emoji: '🍽️', label: 'ate the whole thing' },
      { emoji: '🚀', label: 'blasted off' },
      { emoji: '💃', label: 'danced like crazy' },
      { emoji: '🏊', label: 'splashed around' },
      { emoji: '🤔', label: 'thought real hard' },
      { emoji: '🎤', label: 'sang very loudly' },
      { emoji: '🛌', label: 'went to bed' },
      { emoji: '🏋️', label: 'lifted heavy stuff' },
      { emoji: '🤣', label: 'laughed until crying' },
    ],
  },
  {
    id: 'stuff',
    name: 'stuff',
    icon: '🎉',
    items: [
      { emoji: '🪵', label: 'chopped wood logs' },
      { emoji: '🎺', label: 'very loud trumpet' },
      { emoji: '🪣', label: 'leaky old bucket' },
      { emoji: '🧲', label: 'powerful magnet' },
      { emoji: '🎈', label: 'floaty red balloon' },
      { emoji: '🔧', label: 'rusty old wrench' },
      { emoji: '🪑', label: 'wobbly chair' },
      { emoji: '🛁', label: 'bubbly bathtub' },
      { emoji: '📦', label: 'mysterious box' },
      { emoji: '🧸', label: 'squishy teddy bear' },
      { emoji: '🪝', label: 'crooked hook' },
      { emoji: '🎻', label: 'screechy violin' },
    ],
  },
  {
    id: 'silly',
    name: 'silly',
    icon: '👾',
    items: [
      { emoji: '💥', label: 'big explosion' },
      { emoji: '🌈', label: 'colorful rainbow' },
      { emoji: '👻', label: 'spooky ghost' },
      { emoji: '🤖', label: 'beeping robot' },
      { emoji: '💩', label: 'a ploppy poop' },
      { emoji: '👁️', label: 'watching eyeball' },
      { emoji: '🫧', label: 'floaty bubbles' },
      { emoji: '🌀', label: 'dizzy spiral' },
      { emoji: '🎪', label: 'bonkers circus' },
      { emoji: '🪄', label: 'magic wand' },
      { emoji: '🦠', label: 'tiny gross germ' },
      { emoji: '🫨', label: 'total meltdown' },
    ],
  },
];

export const ALL_EMOJI: EmojiItem[] = EMOJI_CATEGORIES.flatMap((c) => c.items);

export function randomItem(arr: EmojiItem[]): EmojiItem {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomSentence(length?: number): EmojiItem[] {
  const len = length ?? 3 + Math.floor(Math.random() * 3);
  return Array.from({ length: len }, () => randomItem(ALL_EMOJI));
}
