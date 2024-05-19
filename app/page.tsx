import { WhiteboardCanvas } from '@/context/whiteboard/ui/WhiteboardCanvas';

export default function Home() {
  return (
    <main className="w-screen h-screen p-4 bg-slate-100 dark:bg-gradient-to-b dark:from-[#0d2c43] dark:to-[#081a27]">
      <WhiteboardCanvas />
    </main>
  );
}
