import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CloudOff,
  Database,
  FileCheck2,
  FileSpreadsheet,
  FileUp,
  Info,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Upload,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { REQUIRED_FEATURE_COUNT, validateCsv, type CsvIssue } from "@/lib/aquarisk-csv";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AquaRisk | Outbreak Risk Workspace" },
      {
        name: "description",
        content:
          "Prepare and review waterborne outbreak risk estimates in a clear public-health decision-support workspace.",
      },
      { property: "og:title", content: "AquaRisk | Outbreak Risk Workspace" },
      {
        property: "og:description",
        content:
          "Prepare and review waterborne outbreak risk estimates in a clear public-health decision-support workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AquaRiskWorkspace,
});

type View = "workspace" | "prediction";
type InputMode = "upload" | "paste";

function AquaRiskWorkspace() {
  const [view, setView] = useState<View>("workspace");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [fileError, setFileError] = useState("");
  const [predictionNotice, setPredictionNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCsv = inputMode === "upload" ? fileText : pasteText;
  const validation = useMemo(() => (currentCsv ? validateCsv(currentCsv) : null), [currentCsv]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Choose a CSV file ending in .csv. Your current data has not been changed.");
      event.target.value = "";
      return;
    }

    setFileError("");
    setPredictionNotice(false);
    setFileName(file.name);
    setFileText(await file.text());
  }

  function changeInputMode(mode: InputMode) {
    setInputMode(mode);
    setFileError("");
    setPredictionNotice(false);
  }

  function renderIssue(issue: CsvIssue, index: number) {
    if (issue.kind === "empty") return <li key={index}>The CSV is empty. Add at least one data row.</li>;
    if (issue.kind === "column-count") {
      const difference = issue.actual < REQUIRED_FEATURE_COUNT ? "Add" : "Remove";
      return (
        <li key={index}>
          Row {issue.row}: found {issue.actual} values; expected {REQUIRED_FEATURE_COUNT}. {difference}{" "}
          values so every row has the required width.
        </li>
      );
    }

    const value = issue.value.trim() || "blank";
    return (
      <li key={index}>
        Row {issue.row}, feature {issue.column}: “{value}” is not a number. Use numeric values only.
      </li>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen md:grid md:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="border-b border-sidebar-border bg-sidebar md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r">
          <div className="flex items-center gap-3 px-5 py-5 md:px-6 md:py-7">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Waves aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold leading-tight">AquaRisk</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                Public health workspace
              </p>
            </div>
          </div>

          <nav aria-label="Main navigation" className="flex gap-2 overflow-x-auto px-4 pb-4 md:flex-col md:overflow-visible md:px-3">
            <Button
              variant="ghost"
              className={`justify-start ${view === "workspace" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"}`}
              aria-current={view === "workspace" ? "page" : false}
              onClick={() => setView("workspace")}
            >
              <LayoutDashboard aria-hidden="true" />
              Workspace
            </Button>
            <Button
              variant="ghost"
              className={`justify-start ${view === "prediction" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"}`}
              aria-current={view === "prediction" ? "page" : false}
              onClick={() => setView("prediction")}
            >
              <FileUp aria-hidden="true" />
              New prediction
            </Button>
          </nav>

          <div className="hidden flex-1 md:block" />
          <div className="hidden p-4 md:block">
            <div className="rounded-md border border-sidebar-border bg-background/65 p-3.5">
              <div className="flex items-start gap-2.5">
                <CloudOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-risk-medium" />
                <div>
                  <p className="text-xs font-semibold">Model service unavailable</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    CSV checks are available; risk estimates are not connected yet.
                  </p>
                </div>
              </div>
            </div>
            <p className="px-1 pt-4 text-[11px] text-muted-foreground">A decision-support estimate, not a water test.</p>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-7 sm:px-6 md:px-9 md:pt-10">
            {view === "workspace" ? (
              <WorkspaceHome onNewPrediction={() => setView("prediction")} />
            ) : (
              <PredictionEntry
                fileName={fileName}
                fileError={fileError}
                fileInputRef={fileInputRef}
                inputMode={inputMode}
                currentCsv={currentCsv}
                pasteText={pasteText}
                validation={validation}
                predictionNotice={predictionNotice}
                onBack={() => setView("workspace")}
                onChooseFile={() => fileInputRef.current?.click()}
                onFileChange={handleFileChange}
                onInputModeChange={changeInputMode}
                onPasteChange={(value) => {
                  setPasteText(value);
                  setPredictionNotice(false);
                }}
                onGenerate={() => setPredictionNotice(true)}
                onDismissNotice={() => setPredictionNotice(false)}
                renderIssue={renderIssue}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function WorkspaceHome({ onNewPrediction }: { onNewPrediction: () => void }) {
  return (
    <div className="space-y-9">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <Activity aria-hidden="true" className="size-4" />
            Decision support · waterborne disease
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Workspace</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Prepare a model-ready dataset, check its structure, and review estimated outbreak risk when the model is connected.
          </p>
        </div>
        <Button size="lg" onClick={onNewPrediction} className="w-full sm:w-auto">
          <FileUp aria-hidden="true" />
          New prediction
          <ArrowRight aria-hidden="true" />
        </Button>
      </header>

      <section aria-label="Prediction service status" className="flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-risk-medium-soft text-risk-medium">
            <CloudOff aria-hidden="true" className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Prediction service not connected</p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              You can validate prepared CSV data here. No model predictions will be generated until the original model is connected.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit shrink-0 border-risk-medium/30 bg-risk-medium-soft text-risk-medium">
          Validation only
        </Badge>
      </section>

      <section aria-labelledby="workflow-title">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Workflow</p>
            <h2 id="workflow-title" className="mt-1 font-display text-xl font-bold">From prepared data to review</h2>
          </div>
          <Button variant="ghost" onClick={onNewPrediction} className="hidden text-primary sm:inline-flex">
            Start a batch <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <div className="grid gap-0 border-y border-border sm:grid-cols-3">
          <WorkflowStep
            number="01"
            icon={<Database aria-hidden="true" className="size-5" />}
            title="Prepare"
            description="Assemble model-ready numeric data with all 124 features in the model's exact order."
          />
          <WorkflowStep
            number="02"
            icon={<FileSpreadsheet aria-hidden="true" className="size-5" />}
            title="Submit"
            description="Upload a CSV or paste rows, then review any missing, extra, or non-numeric values."
          />
          <WorkflowStep
            number="03"
            icon={<BarChart3 aria-hidden="true" className="size-5" />}
            title="Review"
            description="Compare row-level estimated risk and model confidence after predictions are available."
          />
        </div>
      </section>

      <section aria-labelledby="risk-levels-title" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Model output</p>
          <h2 id="risk-levels-title" className="mt-1 font-display text-xl font-bold">Three estimated risk categories</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Each submitted row receives a model category and confidence score. Confidence describes the model's certainty in its classification—not the probability an outbreak will occur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <RiskLabel tone="low" label="Low risk" />
          <RiskLabel tone="medium" label="Medium risk" />
          <RiskLabel tone="high" label="High risk" />
        </div>
      </section>

      <footer className="flex items-start gap-3 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          AquaRisk provides decision-support estimates only. It is not a laboratory water test, diagnosis, or definitive safety certification. Confirm concerns with appropriate water testing and public-health review.
        </p>
      </footer>
    </div>
  );
}

function WorkflowStep({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 border-b border-border py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-tint text-primary">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{number}</span>
          <h3 className="font-display text-base font-bold">{title}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PredictionEntry({
  fileName,
  fileError,
  fileInputRef,
  inputMode,
  currentCsv,
  pasteText,
  validation,
  predictionNotice,
  onBack,
  onChooseFile,
  onFileChange,
  onInputModeChange,
  onPasteChange,
  onGenerate,
  onDismissNotice,
  renderIssue,
}: {
  fileName: string;
  fileError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  inputMode: InputMode;
  currentCsv: string;
  pasteText: string;
  validation: ReturnType<typeof validateCsv> | null;
  predictionNotice: boolean;
  onBack: () => void;
  onChooseFile: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onInputModeChange: (mode: InputMode) => void;
  onPasteChange: (value: string) => void;
  onGenerate: () => void;
  onDismissNotice: () => void;
  renderIssue: (issue: CsvIssue, index: number) => React.ReactNode;
}) {
  const visibleIssues = validation?.issues.slice(0, 4) ?? [];
  const hiddenIssueCount = Math.max(0, (validation?.issues.length ?? 0) - visibleIssues.length);

  return (
    <div className="space-y-7">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3 mb-3 text-muted-foreground">
          <ArrowLeft aria-hidden="true" /> Workspace
        </Button>
        <p className="mb-2 text-xs font-semibold uppercase text-primary">New batch · CSV input</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">New prediction</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Submit prepared data with 124 numeric model features in the exact order expected by the model.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-risk-medium/30 bg-risk-medium-soft text-risk-medium">
            <CloudOff aria-hidden="true" className="mr-1.5 size-3.5" />
            Prediction service unavailable
          </Badge>
        </div>
      </div>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.8fr)]">
        <section aria-labelledby="input-title" className="min-w-0 rounded-md border border-border bg-card">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-surface-tint text-primary">
                <FileSpreadsheet aria-hidden="true" className="size-4" />
              </div>
              <div>
                <h2 id="input-title" className="font-display text-base font-bold">Model-ready data</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">One record per row · 124 numeric features per record</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            <div className="inline-flex rounded-md border border-border bg-muted p-1" role="tablist" aria-label="CSV input method">
              <Button
                type="button"
                variant={inputMode === "upload" ? "default" : "ghost"}
                size="sm"
                role="tab"
                aria-selected={inputMode === "upload"}
                onClick={() => onInputModeChange("upload")}
              >
                <Upload aria-hidden="true" /> Upload CSV
              </Button>
              <Button
                type="button"
                variant={inputMode === "paste" ? "default" : "ghost"}
                size="sm"
                role="tab"
                aria-selected={inputMode === "paste"}
                onClick={() => onInputModeChange("paste")}
              >
                Paste CSV
              </Button>
            </div>

            {inputMode === "upload" ? (
              <div className="rounded-md border border-dashed border-primary/35 bg-surface-tint/45 px-5 py-8 text-center sm:px-8">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-background text-primary">
                  <FileUp aria-hidden="true" className="size-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">Choose a prepared CSV file</p>
                <p className="mt-1 text-xs text-muted-foreground">Comma-separated numeric rows · .csv only</p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  aria-label="Choose a CSV file"
                  onChange={onFileChange}
                />
                <Button type="button" variant="outline" onClick={onChooseFile} className="mt-4">
                  <Upload aria-hidden="true" />
                  Browse files
                </Button>
                {fileName && (
                  <p className="mt-3 inline-flex max-w-full items-center gap-2 break-all text-xs text-muted-foreground">
                    <FileCheck2 aria-hidden="true" className="size-4 shrink-0 text-risk-low" />
                    {fileName}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="csv-paste" className="mb-2 block text-sm font-medium">
                  Paste numeric rows
                </label>
                <Textarea
                  id="csv-paste"
                  value={pasteText}
                  onChange={(event) => onPasteChange(event.target.value)}
                  placeholder="Paste comma-separated model-ready numeric values, one row per line."
                  className="min-h-40 resize-y font-mono text-xs leading-relaxed"
                />
                <p className="mt-2 text-xs text-muted-foreground">Input stays in this browser tab until you leave or refresh.</p>
              </div>
            )}

            {fileError && (
              <div role="alert" className="flex items-start gap-2.5 rounded-md border border-risk-high/25 bg-risk-high-soft p-3 text-sm text-risk-high">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <p>{fileError}</p>
              </div>
            )}

            {currentCsv && validation && (
              <div aria-live="polite" className={`rounded-md border p-4 ${validation.valid ? "border-risk-low/25 bg-risk-low-soft/55" : "border-risk-medium/25 bg-risk-medium-soft/45"}`}>
                <div className="flex items-start gap-3">
                  {validation.valid ? (
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-risk-low" />
                  ) : (
                    <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-risk-medium" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {validation.valid
                        ? `Structure check passed · ${validation.rows.length} ${validation.rows.length === 1 ? "row" : "rows"}`
                        : "Review these CSV issues"}
                    </p>
                    {validation.issues.length > 0 && (
                      <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
                        {visibleIssues.map(renderIssue)}
                        {hiddenIssueCount > 0 && <li>And {hiddenIssueCount} more issue{hiddenIssueCount === 1 ? "" : "s"}.</li>}
                      </ul>
                    )}
                    {validation.valid && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        All rows contain {REQUIRED_FEATURE_COUNT} numeric values. Column names and model-specific ordering still need confirmation from the original schema.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {validation && validation.rows.length > 0 && (
              <div className="overflow-hidden rounded-md border border-border">
                <div className="flex flex-col gap-1 border-b border-border bg-muted/55 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold">Data preview</p>
                  <p className="text-[11px] text-muted-foreground">First 4 of {REQUIRED_FEATURE_COUNT} features · up to 3 rows</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[29rem] text-left text-xs">
                    <thead className="border-b border-border bg-background text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">Row</th>
                        {[1, 2, 3, 4].map((column) => (
                          <th scope="col" key={column} className="px-3 py-2 font-mono font-medium">Feature {column}</th>
                        ))}
                        <th scope="col" className="px-3 py-2 font-medium">…</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.rows.slice(0, 3).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-border last:border-b-0">
                          <th scope="row" className="px-3 py-2.5 font-mono font-medium text-muted-foreground">{rowIndex + 1}</th>
                          {[0, 1, 2, 3].map((column) => (
                            <td key={column} className="max-w-28 truncate px-3 py-2.5 font-mono text-foreground">
                              {row[column] ?? "—"}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-muted-foreground">{row.length > 4 ? `+${row.length - 4}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {predictionNotice && (
              <div role="status" className="flex items-start justify-between gap-3 rounded-md border border-risk-medium/25 bg-risk-medium-soft/45 p-4">
                <div className="flex items-start gap-2.5">
                  <CloudOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-risk-medium" />
                  <p className="text-sm leading-relaxed">
                    No prediction was generated. The model service is not connected, and your validated CSV remains available above.
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label="Dismiss message" onClick={onDismissNotice}>
                  <span aria-hidden="true">×</span>
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                No risk estimate can be produced until the original model and its preprocessing are connected.
              </p>
              <Button type="button" disabled={!validation?.valid} onClick={onGenerate} className="w-full shrink-0 sm:w-auto">
                <Activity aria-hidden="true" />
                Generate predictions
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-md border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 text-primary" />
              <h2 className="font-display text-sm font-bold">Feature groups</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Model inputs include date and location information, environmental and weather measurements, and water-quality measurements.
            </p>
          </section>

          <details className="group rounded-md border border-border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Info aria-hidden="true" className="size-4 text-primary" />
                View required columns
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t border-border px-4 py-4 sm:px-5">
              <p className="text-sm font-semibold">The model column schema is not connected.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The exact feature names and order are not available in this project. They must come from the original model files; no column names are guessed here.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Until then, only row width and numeric values can be checked. A matching header or model-ready template cannot be verified.
              </p>
            </div>
          </details>

          <div className="rounded-md border border-risk-medium/25 bg-risk-medium-soft/45 p-4 sm:p-5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-risk-medium" />
              <div>
                <p className="text-sm font-semibold">Decision support only</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  A model estimate is not a laboratory water test, diagnosis, or definitive safety certification. Confirm concerns with water testing and public-health review.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RiskLabel({ tone, label }: { tone: "low" | "medium" | "high"; label: string }) {
  const toneClass = {
    low: "border-risk-low/25 bg-risk-low-soft text-risk-low",
    medium: "border-risk-medium/25 bg-risk-medium-soft text-risk-medium",
    high: "border-risk-high/25 bg-risk-high-soft text-risk-high",
  }[tone];

  return <Badge variant="outline" className={toneClass}>{label}</Badge>;
}
