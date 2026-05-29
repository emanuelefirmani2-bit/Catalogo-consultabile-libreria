import { Chat } from "./Chat";

export const metadata = { title: "Chat AI" };

export default function ChatPage() {
  return (
    <div className="space-y-3">
      <header>
        <h2 className="font-display text-2xl">Chat con il catalogo</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Interroga il catalogo in linguaggio naturale. L&apos;assistente AI
          consulta i record in tempo reale e cita le fonti.
        </p>
      </header>
      <Chat />
    </div>
  );
}
