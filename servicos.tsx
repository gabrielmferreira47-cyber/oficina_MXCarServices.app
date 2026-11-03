import { useState } from "react";
import { ClipboardCheck, Home as HomeIcon, Plus, Trash2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { brl, useOficina, type ServicoCatalogo, type TipoAtendimento } from "@/pages/oficina-data";

const TIPOS: { v: TipoAtendimento; label: string; Icon: typeof HomeIcon }[] = [
  { v: "domicilio", label: "A domicílio", Icon: HomeIcon },
  { v: "box", label: "Box oficina", Icon: Warehouse },
  { v: "pre_compra", label: "Avaliação pré-compra", Icon: ClipboardCheck },
];

const alternar = (lista: TipoAtendimento[], v: TipoAtendimento, on: boolean) =>
  on ? Array.from(new Set([...lista, v])) : lista.filter((x) => x !== v);

function NovoServico() {
  const adicionar = useOficina((s) => s.adicionarServico);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [ofertadoEm, setOfertadoEm] = useState<TipoAtendimento[]>(["box"]);
  const [erro, setErro] = useState("");

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(valor);
    if (!nome.trim()) return setErro("Informe o nome do serviço.");
    if (valor === "" || !Number.isFinite(v) || v < 0) return setErro("Informe um valor válido.");
    if (ofertadoEm.length === 0) return setErro("Escolha ao menos um tipo de atendimento.");
    adicionar({ nome: nome.trim(), valor: v, ofertadoEm, ativo: true });
    toast.success(`${nome.trim()} adicionado aos serviços ofertados`);
    setNome(""); setValor(""); setOfertadoEm(["box"]); setErro("");
    document.getElementById("novo-nome")?.focus();
  };

  return (
    <form onSubmit={salvar} aria-labelledby="novo-titulo" className="space-y-3 rounded-lg border bg-card p-4">
      <h2 id="novo-titulo" className="text-sm font-semibold">Novo serviço</h2>
      <div className="grid gap-3 md:grid-cols-[1fr_10rem] lg:grid-cols-[1fr_9rem_auto_auto] md:items-end">
        <div className="space-y-1">
          <Label htmlFor="novo-nome" className="text-xs">Nome do serviço</Label>
          <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={!!erro && !nome.trim()} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="novo-valor" className="text-xs">Valor (R$)</Label>
          <Input id="novo-valor" type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2 md:col-span-2 lg:col-span-1">
          <legend className="sr-only">Ofertado em</legend>
          {TIPOS.map((t) => (
            <label key={t.v} className="flex items-center gap-2 text-sm">
              <Checkbox checked={ofertadoEm.includes(t.v)} onCheckedChange={(c) => setOfertadoEm(alternar(ofertadoEm, t.v, c === true))} />
              {t.label}
            </label>
          ))}
        </fieldset>
        <Button type="submit"><Plus aria-hidden="true" /> Adicionar</Button>
      </div>
      {erro && <p role="alert" className="text-sm font-medium text-destructive">{erro}</p>}
    </form>
  );
}

function LinhaServico({ s, usos }: { s: ServicoCatalogo; usos: number }) {
  const atualizar = useOficina((st) => st.atualizarServico);
  const remover = useOficina((st) => st.removerServico);
  const confirm = useConfirm();
  const [valor, setValor] = useState(String(s.valor));
  const nomeVazio = !s.nome.trim();
  const semTipo = s.ofertadoEm.length === 0;

  const excluir = async () => {
    if (usos > 0) {
      toast.error(`${s.nome} está em ${usos} orçamento(s). Desative-o para não oferecê-lo mais.`);
      return;
    }
    if (await confirm({ title: `Excluir ${s.nome}?`, confirmLabel: "Excluir", destructive: true })) remover(s.id);
  };

  return (
    <tr className={cn(!s.ativo && "text-muted-foreground")}>
      <td className="px-3 py-2">
        <Input aria-label={`Nome de ${s.nome || "serviço"}`} value={s.nome} aria-invalid={nomeVazio || undefined}
          onChange={(e) => atualizar(s.id, { nome: e.target.value })} />
        {nomeVazio && <p className="mt-1 text-xs font-medium text-destructive">Nome obrigatório</p>}
      </td>
      <td className="px-3 py-2">
        <Input aria-label={`Valor de ${s.nome}`} type="number" min={0} step="0.01" className="w-28" value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            const v = Number(e.target.value);
            if (e.target.value !== "" && Number.isFinite(v) && v >= 0) atualizar(s.id, { valor: v });
          }}
          onBlur={() => setValor(String(s.valor))} />
      </td>
      {TIPOS.map((t) => (
        <td key={t.v} className="px-3 py-2 text-center">
          <Checkbox aria-label={`${s.nome} ${t.label}`} checked={s.ofertadoEm.includes(t.v)}
            onCheckedChange={(c) => atualizar(s.id, { ofertadoEm: alternar(s.ofertadoEm, t.v, c === true) })} />
        </td>
      ))}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <Switch aria-label={`${s.nome} ativo`} checked={s.ativo} onCheckedChange={(c) => atualizar(s.id, { ativo: c })} />
          <span className="text-xs font-medium text-foreground">{s.ativo ? "Ativo" : "Inativo"}</span>
        </div>
        {semTipo && s.ativo && <p className="mt-1 text-xs font-medium text-destructive">Sem tipo de atendimento</p>}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-xs text-foreground">{usos}</td>
      <td className="px-2 py-2">
        <Button variant="ghost" size="icon" aria-label={`Excluir ${s.nome}`} onClick={excluir}><Trash2 aria-hidden="true" /></Button>
      </td>
    </tr>
  );
}

export function ServicosPage() {
  const catalogo = useOficina((s) => s.catalogo);
  const orcamentos = useOficina((s) => s.orcamentos);
  const usos = (id: string) => orcamentos.filter((o) => o.itens.some((i) => i.servicoId === id)).length;
  const ativos = catalogo.filter((c) => c.ativo);

  return (
    <section id="editor" tabIndex={-1} aria-labelledby="srv-titulo" className="mx-auto w-full max-w-5xl space-y-6 p-4 outline-none lg:p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 id="srv-titulo" className="text-xl font-semibold">Serviços ofertados</h1>
        <span className="text-sm text-muted-foreground">{ativos.length} ativos de {catalogo.length}</span>
      </div>

      {/* Visão por tipo de atendimento */}
      <div className="grid gap-3 md:grid-cols-3">
        {TIPOS.map(({ v, label, Icon }) => {
          const lista = ativos.filter((c) => c.ofertadoEm.includes(v));
          return (
            <div key={v} className="rounded-lg border bg-card p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="size-4" aria-hidden="true" /> {label} <span className="font-normal text-muted-foreground">· {lista.length}</span></h2>
              <ul className="divide-y text-sm">
                {lista.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 py-1.5"><span>{c.nome || "Sem nome"}</span><span className="tabular-nums font-medium">{brl(c.valor)}</span></li>
                ))}
                {lista.length === 0 && <li className="py-1.5 text-muted-foreground">Nenhum serviço ativo.</li>}
              </ul>
            </div>
          );
        })}
      </div>

      <NovoServico />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <caption className="sr-only">Catálogo de serviços</caption>
          <thead className="bg-muted/60 text-left text-xs">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Serviço</th>
              <th scope="col" className="px-3 py-2 font-medium">Valor (R$)</th>
              <th scope="col" className="px-3 py-2 text-center font-medium">A domicílio</th>
              <th scope="col" className="px-3 py-2 text-center font-medium">Box oficina</th>
              <th scope="col" className="px-3 py-2 text-center font-medium">Pré-compra</th>
              <th scope="col" className="px-3 py-2 font-medium">Situação</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Orçamentos</th>
              <th scope="col" className="px-2 py-2"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {catalogo.map((s) => <LinhaServico key={s.id} s={s} usos={usos(s.id)} />)}
          </tbody>
        </table>
      </div>
    </section>
  );
}
