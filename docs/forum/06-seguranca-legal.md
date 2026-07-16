# 🔐 Fórum 06 — Segurança & Legal

> Como o app protege os dados do usuário e cumpre as leis (LGPD, GDPR, DMCA).
> Detalhes em [STRATEGY.md](../STRATEGY.md).

---

## Mensagens que podemos afirmar (com verdade técnica)

| Mensagem | Por quê é verdade |
|----------|-------------------|
| "Suas chaves de IA nunca saem do seu dispositivo" | BYOK: localStorage, nunca persistida no servidor |
| "Login Google: só e-mail + foto" | OAuth scope padrão (openid email profile) |
| "Cada usuário tem um cofre privado" | Supabase RLS: `WHERE user_id = auth.uid()` |
| "Seus arquivos nunca passam pelos nossos servidores" | Local-first: PDF/EPUB processados no navegador |

---

## Conformidade legal

### LGPD (Brasil) + GDPR (Europa)
- App coleta mínimo: email/foto (via Google login)
- Chaves e arquivos ficam no device → escopo reduzido
- Precisa: Política de Privacidade + fluxo de exclusão de conta

### DMCA Safe Harbor (copyright)
- Usuário traz o próprio arquivo → §512(c)
- Registrar DMCA agent ($6) + notice-and-takedown

### Documentos necessários
- **Política de Privacidade** — gerar com [iubenda](https://www.iubenda.com) (cobre LGPD+GDPR)
- **Termos de Uso** — gerar com [TermsFeed](https://www.termsfeed.com)
- Hospedar em URL HTTPS (na Vercel)

### Pendente
- [ ] Gerar Política de Privacidade
- [ ] Gerar Termos de Uso
- [ ] Registrar DMCA agent
- [ ] Implementar botão de exclusão de conta
- [ ] Implementar botão de report nas respostas da IA
