export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response('App not configured', { status: 500 });
    }

    const url = new URL(request.url);

    // Tentar servir o asset diretamente primeiro
    const response = await env.ASSETS.fetch(request);

    // Se o asset foi encontrado (não é 404), retornar diretamente
    if (response.status !== 404) {
      return response;
    }

    // Para rotas SPA (sem extensão de arquivo), servir index.html
    const hasExtension = url.pathname.includes('.');
    if (!hasExtension) {
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return response;
  }
};
