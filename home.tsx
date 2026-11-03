import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardCheck, ClipboardList, FileSpreadsheet, Home as HomeIcon, Plus, Search, Trash2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import {
  brl, calcular, exportarOS, tipoInfo, itemDoCatalogo, novoItem, servicoDoCatalogo, servicosNaoOfertados, STATUS_ORC, STATUS_OS, useOficina,
  type Item, type Orcamento, type StatusOrcamento, type StatusOS, type TipoAtendimento,
} from "@/pages/oficina-data";

function Tone({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

function Field({ id, label, value, onChange, className, placeholder, type = "text" }: {
  id: string; label: string; value: string | number; onChange: (v: string) => void;
  className?: string; placeholder?: string; type?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder}
        min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ---------- Ilustrações do tipo de atendimento ---------- */
function IlustraDomicilio({ titleId }: { titleId: string }) {
  return (
    <svg viewBox="0 0 160 70" role="img" aria-labelledby={titleId} className="h-16 w-full">
      <title id={titleId}>Mecânico vai até o endereço do cliente</title>
      <path d="M8 62h144" className="stroke-border" strokeWidth="2" />
      <path d="M108 30l22-16 22 16v32h-44z" className="fill-muted stroke-foreground" strokeWidth="2" />
      <rect x="124" y="44" width="12" height="18" className="fill-background stroke-foreground" strokeWidth="2" />
      <path d="M14 58V40h34l10 10h12v8z" className="fill-primary" />
      <circle cx="26" cy="60" r="5" className="fill-foreground" />
      <circle cx="60" cy="60" r="5" className="fill-foreground" />
      <path d="M78 50h22" className="stroke-primary" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M96 46l5 4-5 4" className="stroke-primary" strokeWidth="2" fill="none" />
    </svg>
  );
}
function IlustraBox({ titleId }: { titleId: string }) {
  return (
    <svg viewBox="0 0 160 70" role="img" aria-labelledby={titleId} className="h-16 w-full">
      <title id={titleId}>Veículo no box da oficina</title>
      <path d="M20 62V20l60-14 60 14v42" className="fill-muted stroke-foreground" strokeWidth="2" />
      <path d="M36 62V30h88v32" className="fill-background stroke-foreground" strokeWidth="2" />
      <path d="M50 54V44h40l12 10z" className="fill-primary" />
      <circle cx="60" cy="56" r="5" className="fill-foreground" />
      <circle cx="94" cy="56" r="5" className="fill-foreground" />
      <path d="M44 62h72" className="stroke-foreground" strokeWidth="3" />
      <text x="80" y="25" textAnchor="middle" className="fill-foreground text-[9px] font-semibold">BOX</text>
    </svg>
  );
}

function IlustraPreCompra({ titleId }: { titleId: string }) {
  return (
    <svg viewBox="0 0 160 70" role="img" aria-labelledby={titleId} className="h-16 w-full">
      <title id={titleId}>Avaliação do veículo antes da compra, no local do vendedor</title>
      <path d="M8 62h144" className="stroke-border" strokeWidth="2" />
      <path d="M14 58V40h34l10 10h12v8z" className="fill-primary" />
      <circle cx="26" cy="60" r="5" className="fill-foreground" />
      <circle cx="60" cy="60" r="5" className="fill-foreground" />
      <path d="M76 50h16" className="stroke-primary" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M100 56V44h30l12 12z" className="fill-muted stroke-foreground" strokeWidth="2" />
      <circle cx="110" cy="58" r="4" className="fill-foreground" />
      <circle cx="134" cy="58" r="4" className="fill-foreground" />
      <circle cx="128" cy="22" r="11" className="fill-background stroke-foreground" strokeWidth="2" />
      <path d="M136 30l8 8" className="stroke-foreground" strokeWidth="3" />
      <path d="M123 22l4 4 6-7" className="stroke-primary" strokeWidth="2" fill="none" />
    </svg>
  );
}

/* ---------- Barra de composição do total ---------- */
function Composicao({ o }: { o: Orcamento }) {
  const c = calcular(o);
  const partes = [
    { label: "Serviços", v: c.servicos, cls: "fill-indigo-700 dark:fill-indigo-400", dot: "bg-indigo-700 dark:bg-indigo-400" },
    { label: "Peças", v: c.pecas, cls: "fill-teal-700 dark:fill-teal-400", dot: "bg-teal-700 dark:bg-teal-400" },
    { label: o.tipo === "domicilio" ? "Visita + deslocamento" : o.tipo === "pre_compra" ? "Deslocamento" : "Aluguel do box", v: c.atendimento, cls: "fill-amber-600 dark:fill-amber-400", dot: "bg-amber-600 dark:bg-amber-400" },
  ];
  let x = 0;
  const pct = (v: number) => (c.total > 0 ? (v / c.total) * 100 : 0);
  return (
    <figure className="space-y-3">
      <figcaption id="comp-cap" className="text-xs font-medium text-muted-foreground">Composição do total</figcaption>
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-labelledby="comp-cap comp-desc" className="h-4 w-full overflow-hidden rounded">
        <desc id="comp-desc">{partes.map((p) => `${p.label} ${Math.round(pct(p.v))}%`).join(", ")}</desc>
        <rect width="100" height="10" className="fill-muted" />
        {partes.map((p) => {
          const w = pct(p.v);
          const r = <rect key={p.label} x={x} width={w} height="10" className={p.cls} />;
          x += w;
          return r;
        })}
      </svg>
      <dl className="space-y-1.5 text-sm">
        {partes.map((p) => (
          <div key={p.label} className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-sm", p.dot)} aria-hidden="true" />
            <dt className="flex-1">{p.label}</dt>
            <dd className="tabular-nums">{brl(p.v)}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}

/* ---------- Página ---------- */
export function HomePage() {
  const orcamentos = useOficina((s) => s.orcamentos);
  const ordens = useOficina((s) => s.ordens);
  const atualizar = useOficina((s) => s.atualizar);
  const novoOrcamento = useOficina((s) => s.novoOrcamento);
  const excluir = useOficina((s) => s.excluir);
  const gerarOS = useOficina((s) => s.gerarOS);
  const statusOS = useOficina((s) => s.statusOS);
  const catalogo = useOficina((s) => s.catalogo);
  const confirm = useConfirm();

  const [selId, setSelId] = useState<string>(() => {
    const p = new URLSearchParams(window.location.search).get("orcamento");
    return p ?? useOficina.getState().orcamentos[0]?.id ?? "";
  });
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | StatusOrcamento>("todos");

  const o = orcamentos.find((x) => x.id === selId) ?? orcamentos[0];
  const os = o?.osId ? ordens.find((x) => x.id === o.osId) : undefined;

  useEffect(() => {
    if (!o) return;
    const url = new URL(window.location.href);
    url.searchParams.set("orcamento", o.id);
    window.history.replaceState(null, "", url);
  }, [o]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return orcamentos.filter((x) =>
      (filtro === "todos" || x.status === filtro) &&
      (!q || [x.id, x.cliente.nome, x.veiculo.placa, x.veiculo.modelo, x.osId ?? ""].some((t) => t.toLowerCase().includes(q))));
  }, [orcamentos, busca, filtro]);

  const criar = () => {
    const id = novoOrcamento();
    setSelId(id);
    setTimeout(() => document.getElementById("cli-nome")?.focus(), 50);
  };

  if (!o) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10">
        <ClipboardList className="size-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Nenhum orçamento</p>
        <Button onClick={criar}><Plus aria-hidden="true" /> Novo orçamento</Button>
      </div>
    );
  }

  const c = calcular(o);
  const up = (patch: Partial<Orcamento>) => atualizar(o.id, patch);
  const upCli = (k: keyof Orcamento["cliente"], v: string) => up({ cliente: { ...o.cliente, [k]: v } });
  const upVei = (k: keyof Orcamento["veiculo"], v: string) => up({ veiculo: { ...o.veiculo, [k]: v } });
  const upItem = (id: string, patch: Partial<Item>) => up({ itens: o.itens.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const upTaxa = (k: keyof Orcamento["taxas"], v: string) => up({ taxas: { ...o.taxas, [k]: Number(v) } });
  const num = (v: string) => Math.max(0, Number(v) || 0);
  const naoOfertados = servicosNaoOfertados(o, catalogo);
  const ofertados = catalogo.filter((sv) => sv.ativo && sv.ofertadoEm.includes(o.tipo));
  const tipoTexto = tipoInfo(o.tipo).texto;
  const trocarTipo = (v: TipoAtendimento) => {
    if (v === o.tipo) return;
    up({ tipo: v });
    const fora = o.itens.filter((i) => i.tipo === "servico" && !servicoDoCatalogo(catalogo, i.servicoId)?.ofertadoEm.includes(v));
    if (fora.length > 0) toast.warning(`${fora.length} serviço(s) deste orçamento não são ofertados ${tipoInfo(v).texto}.`);
  };

  const tipos: { v: TipoAtendimento; label: string; Icon: typeof HomeIcon; Ill: typeof IlustraBox }[] = [
    { v: "domicilio", label: "A domicílio", Icon: HomeIcon, Ill: IlustraDomicilio },
    { v: "box", label: "Box oficina", Icon: Warehouse, Ill: IlustraBox },
    { v: "pre_compra", label: "Avaliação pré-compra", Icon: ClipboardCheck, Ill: IlustraPreCompra },
  ];

  const handleGerarOS = () => {
    if (!o.cliente.nome.trim() || !o.veiculo.placa.trim()) {
      toast.error("Informe ao menos o nome do cliente e a placa do veículo para gerar a OS.");
      return;
    }
    if (o.itens.length === 0) {
      toast.error("Adicione ao menos um serviço ou peça para gerar a OS.");
      return;
    }
    if (naoOfertados.length > 0) {
      toast.error(`Há serviços que não são ofertados ${tipoTexto}.`);
      return;
    }
    const id = gerarOS(o.id);
    toast.success(`${id} gerada a partir do ${o.id}`);
  };

  const handleExcluir = async () => {
    const ok = await confirm({
      title: `Excluir ${o.id}?`,
      description: o.osId ? `A ordem de serviço ${o.osId} vinculada também será excluída.` : undefined,
      confirmLabel: "Excluir", destructive: true,
    });
    if (!ok) return;
    const restante = orcamentos.filter((x) => x.id !== o.id);
    excluir(o.id);
    setSelId(restante[0]?.id ?? "");
  };

  return (
    <div className="grid h-full lg:grid-cols-[18rem_1fr_20rem]">
      {/* Lista de orçamentos */}
      <aside aria-label="Orçamentos" className="flex flex-col border-b bg-card lg:h-[calc(100vh-3.5rem)] lg:border-b-0 lg:border-r">
        <div className="space-y-2 border-b p-3">
          <Button className="w-full" onClick={criar}><Plus aria-hidden="true" /> Novo orçamento</Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Buscar por cliente, placa ou número" placeholder="Cliente, placa ou nº" className="pl-8" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
            <SelectTrigger aria-label="Filtrar por status" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {(Object.keys(STATUS_ORC) as StatusOrcamento[]).map((s) => <SelectItem key={s} value={s}>{STATUS_ORC[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground" aria-live="polite">{lista.length} de {orcamentos.length} orçamentos</p>
        </div>
        <ul className="flex-1 divide-y overflow-y-auto">
          {lista.map((x) => {
            const tot = calcular(x).total;
            const ativo = x.id === o.id;
            return (
              <li key={x.id}>
                <button type="button" aria-current={ativo ? "true" : undefined} onClick={() => setSelId(x.id)}
                  className={cn("w-full space-y-1 px-3 py-2.5 text-left outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
                    ativo && "bg-muted shadow-[inset_3px_0_0_var(--primary)]")}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-medium">{x.id}</span>
                    {x.tipo === "domicilio"
                      ? <HomeIcon className="size-3.5" aria-label="A domicílio" />
                      : x.tipo === "pre_compra"
                        ? <ClipboardCheck className="size-3.5" aria-label="Avaliação pré-compra" />
                        : <Warehouse className="size-3.5" aria-label="Box oficina" />}
                    <span className="ml-auto tabular-nums font-medium">{brl(tot)}</span>
                  </div>
                  <div className="truncate text-sm font-medium">{x.cliente.nome || "Novo cliente"}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="truncate">{[x.veiculo.modelo, x.veiculo.placa].filter(Boolean).join(" · ") || "Veículo não informado"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Tone cls={STATUS_ORC[x.status].cls}>{STATUS_ORC[x.status].label}</Tone>
                    {x.osId && <Tone cls="bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">{x.osId}</Tone>}
                  </div>
                </button>
              </li>
            );
          })}
          {lista.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nenhum orçamento encontrado.</li>}
        </ul>
      </aside>

      {/* Editor */}
      <section id="editor" tabIndex={-1} aria-labelledby="orc-titulo" className="space-y-6 p-4 outline-none lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 id="orc-titulo" className="font-mono text-xl font-semibold">{o.id}</h1>
          <Input type="date" aria-label="Data do orçamento" className="w-40" value={o.data} onChange={(e) => up({ data: e.target.value })} />
          <Select value={o.status} onValueChange={(v) => up({ status: v as StatusOrcamento })}>
            <SelectTrigger aria-label="Status do orçamento" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_ORC) as StatusOrcamento[]).map((s) => <SelectItem key={s} value={s}>{STATUS_ORC[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={handleExcluir}>
            <Trash2 aria-hidden="true" /> Excluir
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold">Cliente</legend>
            <Field id="cli-nome" label="Nome" value={o.cliente.nome} onChange={(v) => upCli("nome", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field id="cli-doc" label="CPF/CNPJ" value={o.cliente.documento} onChange={(v) => upCli("documento", v)} />
              <Field id="cli-tel" label="Telefone" type="tel" value={o.cliente.telefone} onChange={(v) => upCli("telefone", v)} />
            </div>
            <Field id="cli-email" label="E-mail" type="email" value={o.cliente.email} onChange={(v) => upCli("email", v)} />
            <Field id="cli-end" label="Endereço" value={o.cliente.endereco} onChange={(v) => upCli("endereco", v)} />
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold">Veículo</legend>
            <div className="grid grid-cols-2 gap-3">
              <Field id="vei-marca" label="Marca" value={o.veiculo.marca} onChange={(v) => upVei("marca", v)} />
              <Field id="vei-modelo" label="Modelo" value={o.veiculo.modelo} onChange={(v) => upVei("modelo", v)} />
              <Field id="vei-ano" label="Ano" value={o.veiculo.ano} onChange={(v) => upVei("ano", v)} />
              <Field id="vei-placa" label="Placa" value={o.veiculo.placa} onChange={(v) => upVei("placa", v.toUpperCase())} />
              <Field id="vei-km" label="Quilometragem" value={o.veiculo.km} onChange={(v) => upVei("km", v)} className="col-span-2" />
            </div>
          </fieldset>
        </div>

        {/* Tipo de atendimento */}
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold">Tipo de atendimento</legend>
          <div role="radiogroup" aria-label="Tipo de atendimento" className="grid gap-3 sm:grid-cols-3">
            {tipos.map(({ v, label, Icon, Ill }) => {
              const sel = o.tipo === v;
              return (
                <button key={v} type="button" role="radio" aria-checked={sel} onClick={() => trocarTipo(v)}
                  className={cn("rounded-lg border-2 p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    sel ? "border-primary bg-card" : "border-border bg-card hover:bg-muted/50")}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="size-4" aria-hidden="true" /> {label}
                    {sel && <span className="ml-auto text-xs font-semibold text-primary">Selecionado</span>}
                  </div>
                  <Ill titleId={`ill-${v}`} />
                </button>
              );
            })}
          </div>
          {o.tipo === "domicilio" ? (
            <div className="grid grid-cols-3 gap-3">
              <Field id="tx-visita" type="number" label="Taxa de visita (R$)" value={o.taxas.taxaVisita} onChange={(v) => upTaxa("taxaVisita", v)} />
              <Field id="km-desl" type="number" label="Deslocamento (km)" value={o.kmDeslocamento} onChange={(v) => up({ kmDeslocamento: num(v) })} />
              <Field id="tx-km" type="number" label="Custo por km (R$)" value={o.taxas.custoKm} onChange={(v) => upTaxa("custoKm", v)} />
            </div>
          ) : o.tipo === "pre_compra" ? (
            <div className="grid grid-cols-3 gap-3">
              <Field id="km-desl" type="number" label="Deslocamento (km)" value={o.kmDeslocamento} onChange={(v) => up({ kmDeslocamento: num(v) })} />
              <Field id="tx-km" type="number" label="Custo por km (R$)" value={o.taxas.custoKm} onChange={(v) => upTaxa("custoKm", v)} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Field id="hr-box" type="number" label="Horas de box" value={o.horasBox} onChange={(v) => up({ horasBox: num(v) })} />
              <Field id="tx-box" type="number" label="Custo por hora (R$)" value={o.taxas.custoHoraBox} onChange={(v) => upTaxa("custoHoraBox", v)} />
            </div>
          )}
        </fieldset>

        {/* Serviços ofertados */}
        <section aria-labelledby="cat-titulo" className="space-y-2">
          <h2 id="cat-titulo" className="text-sm font-semibold">Serviços ofertados {tipoTexto}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {ofertados.map((sv) => {
              const qtd = o.itens.filter((i) => i.servicoId === sv.id).reduce((n, i) => n + i.qtd, 0);
              return (
                <li key={sv.id}>
                  <button type="button" aria-label={`Adicionar ${sv.nome}, ${brl(sv.valor)}`}
                    onClick={() => up({ itens: [...o.itens, itemDoCatalogo(sv)] })}
                    className={cn("flex w-full items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
                      qtd > 0 && "border-primary")}>
                    <Plus className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="flex-1">{sv.nome}</span>
                    {qtd > 0 && <span className="rounded bg-primary px-1.5 text-xs font-semibold text-primary-foreground">{qtd}×</span>}
                    <span className="tabular-nums font-medium">{brl(sv.valor)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Itens */}
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">Itens do orçamento</legend>
          {naoOfertados.length > 0 && (
            <p role="alert" className="flex items-center gap-2 rounded-md border border-amber-600 px-3 py-2 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              {naoOfertados.length} serviço(s) não ofertado(s) {tipoTexto}. Troque o serviço, remova-o ou mude o tipo de atendimento.
            </p>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs">
                <tr>
                  <th scope="col" className="w-24 px-2 py-2 font-medium">Tipo</th>
                  <th scope="col" className="px-2 py-2 font-medium">Descrição</th>
                  <th scope="col" className="w-20 px-2 py-2 font-medium">Qtd</th>
                  <th scope="col" className="w-32 px-2 py-2 font-medium">Valor unit. (R$)</th>
                  <th scope="col" className="w-28 px-2 py-2 text-right font-medium">Subtotal</th>
                  <th scope="col" className="w-10 px-2 py-2"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {o.itens.map((i, idx) => {
                  const fora = i.tipo === "servico" && naoOfertados.includes(i);
                  return (
                    <tr key={i.id} className={cn(fora && "bg-amber-50 dark:bg-amber-950/40")}>
                      <td className="px-2 py-1.5 text-xs font-medium">{i.tipo === "servico" ? "Serviço" : "Peça"}</td>
                      <td className="px-2 py-1.5">
                        {i.tipo === "servico" ? (
                          <div className="space-y-1">
                            <Select value={i.servicoId ?? ""} onValueChange={(v) => {
                              const sv = servicoDoCatalogo(catalogo, v);
                              if (sv) upItem(i.id, { servicoId: sv.id, descricao: sv.nome, valorUnit: sv.valor });
                            }}>
                              <SelectTrigger aria-label={`Serviço do item ${idx + 1}`} aria-invalid={fora || undefined} className="w-full"><SelectValue placeholder="Escolha o serviço" /></SelectTrigger>
                              <SelectContent>
                                {catalogo.filter((sv) => sv.ativo || sv.id === i.servicoId).map((sv) => {
                                  const ok = sv.ofertadoEm.includes(o.tipo) && sv.ativo;
                                  return (
                                    <SelectItem key={sv.id} value={sv.id} disabled={!ok}>
                                      {sv.nome} — {brl(sv.valor)}{!sv.ativo ? " (inativo)" : ok ? "" : ` (só: ${sv.ofertadoEm.map((t) => tipoInfo(t).label).join(", ")})`}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {fora && <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{i.servicoId ? `Não ofertado ${tipoTexto}` : "Serviço fora do catálogo"}</p>}
                          </div>
                        ) : (
                          <Input aria-label={`Descrição da peça do item ${idx + 1}`} placeholder="Descrição da peça" value={i.descricao} onChange={(e) => upItem(i.id, { descricao: e.target.value })} />
                        )}
                      </td>
                      <td className="px-2 py-1.5"><Input aria-label={`Quantidade do item ${idx + 1}`} type="number" min={0} step="1" value={i.qtd} onChange={(e) => upItem(i.id, { qtd: num(e.target.value) })} /></td>
                      <td className="px-2 py-1.5">
                        {i.tipo === "servico"
                          ? <span className="block px-1 tabular-nums">{brl(i.valorUnit)}</span>
                          : <Input aria-label={`Valor unitário do item ${idx + 1}`} type="number" min={0} step="0.01" value={i.valorUnit} onChange={(e) => upItem(i.id, { valorUnit: num(e.target.value) })} />}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{brl(i.qtd * i.valorUnit)}</td>
                      <td className="px-2 py-1.5">
                        <Button variant="ghost" size="icon" aria-label={`Remover item ${idx + 1}`} onClick={() => up({ itens: o.itens.filter((x) => x.id !== i.id) })}>
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {o.itens.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-muted-foreground">Nenhum item.</td></tr>}
              </tbody>
            </table>
          </div>
          <Button variant="outline" size="sm" onClick={() => up({ itens: [...o.itens, novoItem("peca")] })}><Plus aria-hidden="true" /> Peça</Button>
        </fieldset>

        <div className="space-y-1">
          <Label htmlFor="obs" className="text-sm font-semibold">Observações</Label>
          <Textarea id="obs" rows={3} value={o.observacoes} onChange={(e) => up({ observacoes: e.target.value })} />
        </div>
      </section>

      {/* Resumo + OS */}
      <aside aria-labelledby="resumo-titulo" className="space-y-6 border-t bg-card p-4 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-l lg:border-t-0">
        <div className="space-y-4">
          <h2 id="resumo-titulo" className="text-sm font-semibold">Resumo do orçamento</h2>
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-3xl font-semibold tabular-nums" aria-live="polite">{brl(c.total)}</div>
          </div>
          <Composicao o={o} />
          <div className="rounded-md border p-3 text-xs">
            {o.tipo === "domicilio" ? (
              <dl className="space-y-1">
                <div className="flex justify-between"><dt>Taxa de visita</dt><dd className="tabular-nums">{brl(c.visita)}</dd></div>
                <div className="flex justify-between gap-2"><dt>Deslocamento ({o.kmDeslocamento} km × {brl(o.taxas.custoKm)})</dt><dd className="tabular-nums">{brl(c.deslocamento)}</dd></div>
              </dl>
            ) : o.tipo === "pre_compra" ? (
              <dl><div className="flex justify-between gap-2"><dt>Deslocamento ({o.kmDeslocamento} km × {brl(o.taxas.custoKm)})</dt><dd className="tabular-nums">{brl(c.deslocamento)}</dd></div></dl>
            ) : (
              <dl><div className="flex justify-between gap-2"><dt>Box ({o.horasBox} h × {brl(o.taxas.custoHoraBox)})</dt><dd className="tabular-nums">{brl(c.box)}</dd></div></dl>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h2 className="text-sm font-semibold">Ordem de serviço</h2>
          {os ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold">{os.id}</span>
                <Tone cls={STATUS_OS[os.status].cls}>{STATUS_OS[os.status].label}</Tone>
              </div>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between"><dt>Orçamento vinculado</dt><dd className="font-mono">{o.id}</dd></div>
                <div className="flex justify-between"><dt>Abertura</dt><dd>{os.abertura.split("-").reverse().join("/")}</dd></div>
              </dl>
              <Select value={os.status} onValueChange={(v) => statusOS(os.id, v as StatusOS)}>
                <SelectTrigger aria-label="Status da OS" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_OS) as StatusOS[]).map((s) => <SelectItem key={s} value={s}>{STATUS_OS[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={() => exportarOS(os, o)}>
                <FileSpreadsheet aria-hidden="true" /> Baixar OS em Excel
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={handleGerarOS} disabled={o.status === "recusado"}>
              <ClipboardList aria-hidden="true" /> Gerar OS
            </Button>
          )}
          {!os && o.status === "recusado" && <p className="text-xs">Orçamento recusado não gera OS.</p>}
        </div>
      </aside>
    </div>
  );
}
