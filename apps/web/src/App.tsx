import { Button } from "@/components/ui/button";
import { useHello } from "@/stores/hello";

export default function App() {
  const { count, bump } = useHello();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <Button onClick={bump}>Bump ({count})</Button>
    </main>
  );
}
