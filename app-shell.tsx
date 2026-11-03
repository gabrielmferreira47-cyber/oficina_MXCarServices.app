import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { routes } from "@/routes";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { FileSpreadsheet, Settings2, Wrench } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { exportarTodasOS, useOficina, type Taxas } from "@/pages/oficina-data";
import { toast } from "sonner";

function TaxasPadrao() {
  const taxas = useOficina((s) => s.taxasPadrao);
  const setTaxas = useOficina((s) => s.setTaxasPadrao);
  const [draft, setDraft] = useState<Taxas>(taxas);
  const campos: { k: keyof Taxas; label: string }[] = [
    { k: "taxaVisita", label: "Taxa fixa de visita (R$)" },
    { k: "custoKm", label: "Custo de deslocamento (R$/km)" },
    { k: "custoHoraBox", label: "Aluguel do box (R$/hora)" },
  ];
  return (
    <Popover onOpenChange={(o) => o && setDraft(taxas)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/15 hover:text-white">
          <Settings2 aria-hidden="true" /> Taxas padrão
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setTaxas(draft);
            toast.success("Taxas padrão atualizadas para novos orçamentos");
          }}
        >
          <h2 className="text-sm font-semibold">Taxas padrão</h2>
          {campos.map((c) => (
            <div key={c.k} className="space-y-1">
              <Label htmlFor={`tx-${c.k}`}>{c.label}</Label>
              <Input
                id={`tx-${c.k}`}
                type="number"
                min={0}
                step="0.01"
                value={draft[c.k]}
                onChange={(e) => setDraft({ ...draft, [c.k]: Number(e.target.value) })}
              />
            </div>
          ))}
          <Button type="submit" size="sm" className="w-full">Salvar</Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const ordens = useOficina((s) => s.ordens);
  const orcamentos = useOficina((s) => s.orcamentos);
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#editor"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-indigo-900 px-4 text-white">
        <Wrench className="size-5" aria-hidden="true" />
        <span className="font-semibold tracking-tight">Oficina</span>
        <nav aria-label="Principal" className="ml-4 flex items-center gap-1">
          {routes.filter((r) => r.label).map((r) => {
            const Icon = r.icon;
            return (
              <NavLink key={r.path} to={r.path} end
                className={({ isActive }) => cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white",
                  isActive && "bg-white text-indigo-900 hover:bg-white")}>
                {Icon && <Icon className="size-4" aria-hidden="true" />}{r.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <TaxasPadrao />
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/15 hover:text-white"
            disabled={ordens.length === 0}
            onClick={() => exportarTodasOS(ordens, orcamentos)}
          >
            <FileSpreadsheet aria-hidden="true" /> Exportar OS (Excel)
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex-1"
        >
          <Outlet />
        </motion.div>
      </main>
      <Toaster />
    </div>
  );
}

export default AppShell;
