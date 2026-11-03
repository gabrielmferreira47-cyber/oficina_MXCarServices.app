import { HashRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { routes } from "@/routes";

// HashRouter: as rotas ficam depois do "#" (ex.: .../#/servicos), o que funciona
// no GitHub Pages sem configuração extra de servidor.
export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ConfirmDialogProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<AppShell />}>
              {routes.map((r) =>
                r.path === "/" ? (
                  <Route key={r.path} index element={r.element} />
                ) : (
                  <Route key={r.path} path={r.path} element={r.element} />
                ),
              )}
              <Route path="*" element={<p className="p-6">Página não encontrada.</p>} />
            </Route>
          </Routes>
        </HashRouter>
      </ConfirmDialogProvider>
    </MotionConfig>
  );
}
