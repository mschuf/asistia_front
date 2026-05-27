import { FiCpu } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function AssistantPage() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <FiCpu className="h-8 w-8" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-brand-600">Módulo IA</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Asistente inteligente</h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Este módulo está preparado como scaffold. Próximamente podrás conversar con un asistente para crear
          tickets, consultar estado y recibir sugerencias de solución.
        </p>
        <Link
          to="/tickets"
          className="mt-8 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          Volver a tickets
        </Link>
      </div>
    </div>
  );
}
