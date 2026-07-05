"use client";

import { useEffect, useMemo, useState } from "react";
import { workflows } from "@/lib/workflows";

type Job = {
  id: string;
  status: "succeeded" | "failed" | "queued" | "running";
  provider: string;
  workflowId: string;
  workflowName: string;
  kind: string;
  cost: number;
  prompt: string;
  inputImageUrl: string | null;
  outputUrl: string;
  startedAt: string;
  completedAt: string;
};

const STORAGE_KEYS = {
  credits: "aimediaos_credits",
  history: "aimediaos_history"
};

export default function Home() {
  const [workflowId, setWorkflowId] = useState(workflows[0].id);
  const [prompt, setPrompt] = useState("Luxury AI media campaign for a new creative platform called AIMediaOS");
  const [inputImageUrl, setInputImageUrl] = useState("");
  const [credits, setCredits] = useState(50);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === workflowId) ?? workflows[0],
    [workflowId]
  );

  useEffect(() => {
    const savedCredits = window.localStorage.getItem(STORAGE_KEYS.credits);
    const savedHistory = window.localStorage.getItem(STORAGE_KEYS.history);

    if (savedCredits) setCredits(Number(savedCredits));
    if (savedHistory) {
      const parsedJobs = JSON.parse(savedHistory) as Job[];
      setJobs(parsedJobs);
      setActiveJob(parsedJobs[0] ?? null);
    }
  }, []);

  function persist(nextCredits: number, nextJobs: Job[]) {
    setCredits(nextCredits);
    setJobs(nextJobs);
    window.localStorage.setItem(STORAGE_KEYS.credits, String(nextCredits));
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(nextJobs.slice(0, 9)));
  }

  async function generate() {
    setError("");

    if (credits < selectedWorkflow.cost) {
      setError("Not enough credits. Reset credits or choose a lower-cost workflow.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, prompt, inputImageUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed");
      }

      const job = data.job as Job;
      const nextJobs = [job, ...jobs].slice(0, 9);
      const nextCredits = credits - job.cost;
      setActiveJob(job);
      persist(nextCredits, nextJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  function resetDemo() {
    persist(50, []);
    setActiveJob(null);
    setError("");
  }

  return (
    <main className="app-shell">
      <header className="header">
        <div className="logo">
          <div className="logo-mark">AI</div>
          <span>AIMediaOS</span>
        </div>
        <div className="badge">Demo credits: {credits}</div>
      </header>

      <section className="hero">
        <div className="card">
          <p className="badge">Working MVP • local provider • develop branch</p>
          <h1 className="hero-title">
            Build, route, and monetize <span className="gradient-text">AI media workflows.</span>
          </h1>
          <p className="muted">
            This MVP proves the product loop: choose a workflow, submit a prompt, run a generation job,
            deduct credits, return media, and save history. Swap the local provider with a real AI provider when keys are added.
          </p>

          <div className="stats">
            <div className="stat"><strong>{workflows.length}</strong><span className="muted">workflows</span></div>
            <div className="stat"><strong>{jobs.length}</strong><span className="muted">jobs saved</span></div>
            <div className="stat"><strong>{credits}</strong><span className="muted">credits</span></div>
            <div className="stat"><strong>1</strong><span className="muted">provider</span></div>
          </div>

          <div className="grid">
            {workflows.map((workflow) => (
              <div
                className={`workflow ${workflow.id === workflowId ? "active" : ""}`}
                key={workflow.id}
                role="button"
                tabIndex={0}
                onClick={() => setWorkflowId(workflow.id)}
                onKeyDown={(event) => event.key === "Enter" && setWorkflowId(workflow.id)}
              >
                <h3>{workflow.name}</h3>
                <p className="muted">{workflow.description}</p>
                <p>{workflow.kind} • {workflow.cost} credits</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Create media</h2>
          <div className="form-row">
            <label>Workflow</label>
            <select value={workflowId} onChange={(event) => setWorkflowId(event.target.value)}>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Prompt</label>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          </div>
          <div className="form-row">
            <label>Optional input image URL</label>
            <input value={inputImageUrl} onChange={(event) => setInputImageUrl(event.target.value)} placeholder="https://example.com/input.png" />
          </div>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <button onClick={generate} disabled={isGenerating || prompt.length < 3}>
              {isGenerating ? "Generating..." : `Generate for ${selectedWorkflow.cost} credits`}
            </button>
            <button onClick={resetDemo} type="button" style={{ background: "rgba(255,255,255,0.14)" }}>Reset demo</button>
          </div>
        </div>
      </section>

      <section className="card preview" style={{ marginTop: "1rem" }}>
        {activeJob ? (
          <div style={{ width: "100%" }}>
            <div className="header">
              <div>
                <h2>{activeJob.workflowName}</h2>
                <p className="muted">{activeJob.provider} • {activeJob.status} • {activeJob.cost} credits • {activeJob.id}</p>
              </div>
              <a className="badge" href={activeJob.outputUrl} download={`aimediaos-${activeJob.id}.svg`}>Download SVG</a>
            </div>
            <img src={activeJob.outputUrl} alt="Generated AIMediaOS output" />
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <h2>No generation yet</h2>
            <p className="muted">Choose a workflow and generate your first media asset.</p>
          </div>
        )}
      </section>

      {jobs.length > 0 && (
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Recent jobs</h2>
          <div className="history">
            {jobs.map((job) => (
              <button key={job.id} className="history-item" onClick={() => setActiveJob(job)} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "1rem", padding: "0.7rem", textAlign: "left" }}>
                <img src={job.outputUrl} alt={job.workflowName} />
                <strong>{job.workflowName}</strong>
                <p className="muted">{job.cost} credits • {new Date(job.completedAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
