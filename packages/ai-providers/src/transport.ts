/**
 * Camada de transporte.
 *
 * Os adapters não chamam `fetch` diretamente — chamam `transport.request()`.
 * Isso desacopla "o que pedir ao provedor" de "como a requisição viaja":
 *
 *   - No navegador: `createProxyTransport("/api/proxy")` envia a requisição
 *     por uma API Route nossa, que fura o CORS dos provedores. A chave do
 *     usuário viaja no header, nunca persiste no servidor.
 *   - Em código de servidor (se precisar um dia): `createDirectTransport()`
 *     faz o fetch puro, sem intermediário.
 */

export interface TransportResponse {
  status: number;
  /** Corpo já parseado como objeto (espera-se JSON). */
  body: unknown;
}

export interface TransportRequest {
  method: string;
  headers: Record<string, string>;
  body: string;
}

export interface Transport {
  request(url: string, init: TransportRequest): Promise<TransportResponse>;
  /**
   * Stream: devolve o Response BRUTO do fetch (com .body legível como stream).
   * Usado pra respostas streaming (SSE) dos LLMs. Opcional — só transports
   * que suportam fetch nativo implementam.
   */
  stream?(url: string, init: TransportRequest): Promise<Response>;
}

/**
 * Erro do proxy-stream. Carrega o status HTTP do provedor + detalhe,
 * pra o caller (ai-client) traduzir numa mensagem amigável pro usuário.
 */
export class ProxyStreamError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly providerDetail?: string,
  ) {
    super(`Proxy-stream respondeu ${statusCode}: ${providerDetail ?? ""}`);
    this.name = "ProxyStreamError";
  }
}

// ─── Transporte via proxy (cliente) ──────────────────────────────────────

/**
 * Cria um transport que roteia TODA requisição por uma API Route proxy.
 * O navegador nunca fala direto com o provedor — evita bloqueio de CORS.
 *
 * @param proxyPath caminho da rota proxy (default "/api/proxy").
 */
export function createProxyTransport(proxyPath = "/api/proxy"): Transport {
  return {
    async request(url, init): Promise<TransportResponse> {
      let res: Response;
      try {
        res = await fetch(proxyPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, ...init }),
        });
      } catch (err) {
        throw new Error(`Falha de rede ao contatar o proxy: ${String(err)}`);
      }

      // O proxy devolve sempre JSON no formato { status, body } ou { error }.
      let envelope: unknown;
      try {
        envelope = await res.json();
      } catch (err) {
        throw new Error(`Resposta do proxy não era JSON: ${String(err)}`);
      }

      const env = envelope as {
        status?: number;
        body?: unknown;
        error?: string;
      };

      if (!res.ok || env.error) {
        throw new Error(
          env.error ?? `Proxy respondeu ${res.status}.`,
        );
      }

      return {
        status: env.status ?? res.status,
        body: env.body,
      };
    },

    /**
     * Stream: faz fetch pra uma rota proxy-stream que devolve o Response
     * BRUTO (com .body legível como ReadableStream). Usado pra SSE dos LLMs.
     */
    async stream(url, init): Promise<Response> {
      const res = await fetch("/api/proxy-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...init }),
      });
      if (!res.ok) {
        // Lê o corpo do erro do provedor pra dar uma mensagem útil.
        let detail = "";
        try {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            detail = json?.error?.message ?? json?.message ?? text;
          } catch {
            detail = text;
          }
        } catch {
          /* ignora */
        }
        // Inclui status + detalhe pra o ai-client traduzir depois.
        throw new ProxyStreamError(res.status, detail);
      }
      return res;
    },
  };
}

// ─── Transporte direto (servidor / Node) ─────────────────────────────────

/**
 * Cria um transport que faz fetch puro, sem intermediário.
 * Use SOMENTE em código de servidor — no navegador os provedores bloqueiam
 * por CORS. Útil para testes ou Server Components.
 */
export function createDirectTransport(): Transport {
  return {
    async request(url, init): Promise<TransportResponse> {
      let res: Response;
      try {
        res = await fetch(url, init);
      } catch (err) {
        throw new Error(`Falha de rede: ${String(err)}`);
      }

      let body: unknown = null;
      const text = await res.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      return { status: res.status, body };
    },
  };
}
