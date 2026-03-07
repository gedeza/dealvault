"use client";

import { useEffect, useState } from "react";

interface PathItem {
  [method: string]: {
    tags?: string[];
    summary?: string;
    parameters?: { name: string; in: string; required?: boolean; schema?: { type?: string; enum?: string[] }; description?: string }[];
    requestBody?: { required?: boolean; content?: Record<string, { schema?: Record<string, unknown> }> };
    responses?: Record<string, { description?: string }>;
    security?: Record<string, string[]>[];
  };
}

interface OpenAPISpec {
  info: { title: string; version: string; description: string };
  paths: Record<string, PathItem>;
}

const METHOD_COLORS: Record<string, string> = {
  get: "bg-blue-100 text-blue-800",
  post: "bg-green-100 text-green-800",
  patch: "bg-amber-100 text-amber-800",
  delete: "bg-red-100 text-red-800",
};

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then(setSpec);
  }, []);

  if (!spec) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading API documentation...</p>
      </div>
    );
  }

  const grouped: Record<string, { method: string; path: string; op: PathItem[string] }[]> = {};
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods as PathItem)) {
      const tag = op.tags?.[0] || "Other";
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push({ method, path, op });
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{spec.info.title}</h1>
        <p className="text-muted-foreground mt-1">{spec.info.description}</p>
        <p className="text-sm text-muted-foreground mt-1">Version {spec.info.version}</p>
      </div>

      {Object.entries(grouped).map(([tag, endpoints]) => (
        <div key={tag} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">{tag}</h2>
          <div className="space-y-3">
            {endpoints.map(({ method, path, op }) => (
              <details
                key={`${method}-${path}`}
                className="border rounded-lg overflow-hidden"
              >
                <summary className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${METHOD_COLORS[method] || "bg-muted"}`}
                  >
                    {method}
                  </span>
                  <code className="text-sm font-mono">{path}</code>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {op.summary}
                  </span>
                </summary>
                <div className="p-4 border-t bg-muted/20 space-y-3">
                  {op.parameters && op.parameters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Parameters</h4>
                      <div className="space-y-1">
                        {op.parameters.map((p) => (
                          <div key={p.name} className="text-sm flex gap-2">
                            <code className="bg-muted px-1 rounded">{p.name}</code>
                            <span className="text-muted-foreground">({p.in})</span>
                            {p.required && <span className="text-red-500 text-xs">required</span>}
                            {p.description && <span className="text-muted-foreground">— {p.description}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {op.responses && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Responses</h4>
                      <div className="space-y-1">
                        {Object.entries(op.responses).map(([code, resp]) => (
                          <div key={code} className="text-sm flex gap-2">
                            <span className={`font-mono ${code.startsWith("2") ? "text-green-600" : "text-red-500"}`}>
                              {code}
                            </span>
                            <span className="text-muted-foreground">{resp.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
