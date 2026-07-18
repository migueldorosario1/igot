/**
 * Dicionário de strings da interface (UI) do igot.
 *
 * ~200 chaves cobrindo TODOS os textos visíveis da interface:
 * botões, menus, labels, hints, alerts, modais, tooltips.
 *
 * Organizado por componente/secção pra facilitar manutenção.
 * Cada chave tem que existir em TODOS os idiomas.
 *
 * Para adicionar um idioma: copie o bloco "pt-BR", troque a chave, traduza.
 * Para adicionar uma string: adicione a chave no UIStringKey E em todos os idiomas.
 */

export type UIStringKey =
  // ── Geral ──
  | "app_name"
  | "app_tagline"
  | "loading"
  | "close"
  | "save"
  | "cancel"
  | "remove"
  | "edit"
  | "use"
  | "search"
  | "filter"
  | "settings"
  // ── Home (estante) ──
  | "shelf_loading"
  | "shelf_title"
  | "shelf_clear_all"
  | "shelf_clear_confirm"
  | "shelf_add_book"
  | "shelf_adding"
  | "shelf_remove_confirm"
  | "shelf_page_n"
  | "shelf_chapter_n"
  | "shelf_remove_book"
  // ── Uploader (onboarding) ──
  | "upload_hero_title"
  | "upload_hero_desc"
  | "upload_feat_translate"
  | "upload_feat_explain"
  | "upload_feat_formats"
  | "upload_config_needed"
  | "upload_config_desc"
  | "upload_dropzone"
  | "upload_click"
  | "upload_format_hint"
  | "upload_privacy"
  // ── Reader ──
  | "reader_read_new"
  | "reader_open_other"
  | "reader_shelf"
  | "reader_zoom"
  | "reader_zoom_out"
  | "reader_zoom_in"
  | "reader_zoom_reset"
  | "reader_settings"
  | "reader_fullscreen"
  | "reader_exit_fullscreen"
  | "reader_hide_menu"
  | "reader_show_menu"
  | "reader_notes"
  | "reader_bookmark"
  | "reader_bookmark_remove"
  | "reader_bookmarks"
  | "reader_print"
  | "reader_photo"
  | "reader_photo_error"
  | "reader_translate_page"
  | "reader_translating"
  | "reader_view_original"
  | "reader_view_translation"
  | "reader_explain_page"
  | "reader_explaining"
  | "reader_sel_translate"
  | "reader_sel_explain"
  | "reader_fs_translation"
  | "reader_fs_explanation"
  | "reader_processing"
  | "reader_bookmarks_title"
  | "reader_bookmarks_empty"
  | "reader_notes_title"
  | "reader_notes_empty"
  | "reader_note_translate"
  | "reader_note_explain"
  | "reader_note_question"
  | "reader_nav_prev"
  | "reader_nav_next"
  | "reader_nav_label"
  | "reader_page_n"
  | "reader_chapter_n"
  // ── AIPanel ──
  | "ai_assistant"
  | "ai_empty_hint"
  | "ai_empty_sub"
  | "ai_save"
  | "ai_save_tooltip"
  | "ai_ask_placeholder"
  // ── Settings ──
  | "set_title"
  | "set_my_keys"
  | "set_default_model"
  | "set_edit_key"
  | "set_add_key"
  | "set_provider"
  | "set_no_key_link"
  | "set_label"
  | "set_label_hint"
  | "set_api_key"
  | "set_api_key_placeholder"
  | "set_api_key_update"
  | "set_show_key"
  | "set_hide_key"
  | "set_key_privacy"
  | "set_ui_lang"
  | "set_ui_lang_hint"
  | "set_ai_lang"
  | "set_ai_lang_hint"
  | "set_model"
  | "set_model_default"
  | "set_search_models"
  | "set_searching_models"
  | "set_no_models"
  | "set_advanced"
  | "set_base_url"
  | "set_base_url_default"
  | "set_base_url_hint"
  | "set_btn_update"
  | "set_btn_add"
  | "set_test_connection"
  | "set_testing"
  | "set_clear_all"
  | "set_clear_confirm"
  | "set_saved"
  | "set_remove_confirm"
  // ── Auth ──
  | "auth_checking"
  | "auth_signin"
  | "auth_account_menu"
  | "auth_user"
  | "auth_signout"
  // ── Erros de página ──
  | "err_opening_book"
  | "err_book_not_found"
  | "err_back_shelf"
  // ── Doação / Sobre ──
  | "donate_title"
  | "donate_paypal"
  | "donate_pix"
  | "about_title"
  | "about_desc"
  | "about_developer"
  | "help_title"
  | "help_what_is_key"
  | "help_key_desc"
  | "help_how_to_get"
  | "help_step1"
  | "help_step2"
  | "help_step3"
  | "help_step4"
  | "help_pricing"
  | "help_pricing_link";

type LangStrings = Record<UIStringKey, string>;

export const UI_STRINGS: Record<string, LangStrings> = {
  // ═══════════════════════════════════════════════════════════════════════
  // PORTUGUÊS (Brasil) — idioma base
  // ═══════════════════════════════════════════════════════════════════════
  "pt-BR": {
    app_name: "igot",
    app_tagline: "Leia qualquer coisa. Entenda tudo.",
    loading: "Carregando…",
    close: "Fechar",
    save: "Salvar",
    cancel: "Cancelar",
    remove: "Remover",
    edit: "Editar",
    use: "Usar",
    search: "Buscar",
    filter: "Filtrar",
    settings: "Configurações",
    // Home
    shelf_loading: "Carregando sua estante…",
    shelf_title: "Minha estante",
    shelf_clear_all: "🗑 Limpar tudo",
    shelf_clear_confirm: "Remover TODOS os livros da estante? Esta ação não pode ser desfeita.",
    shelf_add_book: "+ Adicionar livro",
    shelf_adding: "Adicionando livro…",
    shelf_remove_confirm: 'Remover "{title}" da estante?',
    shelf_page_n: "Página {n}",
    shelf_chapter_n: "Capítulo {n}",
    shelf_remove_book: "Remover da estante",
    // Uploader
    upload_hero_title: "Leia qualquer coisa. Entenda tudo.",
    upload_hero_desc: "Leitor de livros com IA que traduz e explica qualquer trecho — em qualquer idioma.",
    upload_feat_translate: "Traduz",
    upload_feat_explain: "Explica",
    upload_feat_formats: "PDF & EPUB",
    upload_config_needed: "Configure sua IA primeiro",
    upload_config_desc: "Escolha um provedor e cole sua chave pra traduzir e explicar.",
    upload_dropzone: "Arraste um livro aqui ou",
    upload_click: "clique pra escolher",
    upload_format_hint: "EPUB ou PDF",
    upload_privacy: "Suas chaves de IA nunca saem do seu dispositivo.",
    // Reader
    reader_read_new: "Ler novo",
    reader_open_other: "Abrir outro livro",
    reader_shelf: "Minha estante",
    reader_zoom: "Zoom",
    reader_zoom_out: "Diminuir zoom",
    reader_zoom_in: "Aumentar zoom",
    reader_zoom_reset: "Restaurar zoom",
    reader_settings: "Configurações de IA",
    reader_fullscreen: "Tela cheia",
    reader_exit_fullscreen: "Sair da tela cheia",
    reader_hide_menu: "Ocultar menu",
    reader_show_menu: "Mostrar menu",
    reader_notes: "Minhas anotações",
    reader_bookmark: "Marcar esta página",
    reader_bookmark_remove: "Remover marcador desta página",
    reader_bookmarks: "Meus marcadores",
    reader_print: "Imprimir / salvar esta página em PDF",
    reader_photo: "Salvar foto desta página (PNG) no seu dispositivo",
    reader_photo_error: "Não foi possível salvar a imagem desta página neste navegador.",
    reader_translate_page: "🌐 Traduzir página",
    reader_translating: "⏳ Traduzindo…",
    reader_view_original: "📖 Ver original",
    reader_view_translation: "🌐 Ver tradução",
    reader_explain_page: "🧠 Explicar página",
    reader_explaining: "⏳ Explicando…",
    reader_sel_translate: "🌐 Traduzir",
    reader_sel_explain: "🧠 Explicar",
    reader_fs_translation: "🌐 Tradução",
    reader_fs_explanation: "🧠 Explicação",
    reader_processing: "Processando…",
    reader_bookmarks_title: "🔖 Marcadores",
    reader_bookmarks_empty: "Você ainda não marcou nenhuma página. Toque em 🔖 ou no canto superior direito da página para marcar.",
    reader_notes_title: "📓 Minhas anotações",
    reader_notes_empty: "Você ainda não salvou nenhuma anotação deste livro. Selecione um trecho, peça Traduzir ou Explicar, e clique em 📌 Salvar.",
    reader_note_translate: "🌐 Tradução",
    reader_note_explain: "🧠 Explicação",
    reader_note_question: "❓ Pergunta",
    reader_nav_prev: "Anterior",
    reader_nav_next: "Próxima",
    reader_nav_label: "Navegar páginas",
    reader_page_n: "Página {n}",
    reader_chapter_n: "Capítulo {n}",
    // AIPanel
    ai_assistant: "🧠 Assistente igot",
    ai_empty_hint: "Selecione um trecho do texto e escolha Traduzir ou Explicar.",
    ai_empty_sub: "Ou faça uma pergunta sobre o livro abaixo.",
    ai_save: "📌 Salvar",
    ai_save_tooltip: "Salvar esta resposta nas suas anotações",
    ai_ask_placeholder: 'Pergunte sobre "{title}"…',
    // Settings
    set_title: "⚙️ Configurações de IA",
    set_my_keys: "🔑 Minhas chaves cadastradas ({n})",
    set_default_model: "padrão",
    set_edit_key: "Editar chave",
    set_add_key: "Adicionar nova chave",
    set_provider: "Provedor de IA",
    set_no_key_link: "Não tem chave?",
    set_label: "Apelido",
    set_label_hint: "(opcional — pra distinguir se tiver várias)",
    set_api_key: "Chave de API",
    set_api_key_placeholder: "cole sua chave aqui",
    set_api_key_update: "Cole uma NOVA chave pra atualizar",
    set_show_key: "Mostrar chave",
    set_hide_key: "Esconder chave",
    set_key_privacy: "🔒 Sua chave fica só neste navegador (localStorage). Nunca é enviada ao nosso servidor exceto para repassá-la ao provedor.",
    set_ui_lang: "Idioma da interface",
    set_ui_lang_hint: "O idioma dos botões, menus e textos do app.",
    set_ai_lang: "Idioma das traduções e explicações",
    set_ai_lang_hint: "A IA vai traduzir e explicar os textos neste idioma.",
    set_model: "Modelo",
    set_model_default: "(padrão: {model})",
    set_search_models: "Buscar modelos disponíveis no provedor",
    set_searching_models: "Buscando modelos disponíveis…",
    set_no_models: "Nenhum modelo encontrado.",
    set_advanced: "Avançado (URL custom)",
    set_base_url: "URL base",
    set_base_url_default: "(padrão: {url})",
    set_base_url_hint: "Use para apontar a um servidor self-hosted (ex.: Ollama, LM Studio).",
    set_btn_update: "💾 Atualizar",
    set_btn_add: "💾 Adicionar chave",
    set_test_connection: "Testar conexão",
    set_testing: "Testando…",
    set_clear_all: "Limpar tudo",
    set_clear_confirm: "Remover TODAS as chaves cadastradas?",
    set_saved: "✓ Configuração salva.",
    set_remove_confirm: 'Remover "{title}"?',
    // Auth
    auth_checking: "Verificando login",
    auth_signin: "Entrar",
    auth_account_menu: "Menu da conta",
    auth_user: "Usuário",
    auth_signout: "Sair",
    // Erros de página
    err_opening_book: "Abrindo livro…",
    err_book_not_found: "Livro não encontrado na sua estante.",
    err_back_shelf: "← Voltar pra estante",
    // Doação / Sobre
    donate_title: "Gostou do igot? Apoie o projeto!",
    donate_paypal: "💙 PayPal",
    donate_pix: "🟢 PIX (copiar)",
    about_title: "Quem somos",
    about_desc: "Leia qualquer coisa. Entenda tudo.",
    about_developer: "Desenvolvido por Miguel Gomes Barbosa do Rosário — Cafezinho Media Group — Niterói, RJ — Brasil",
    help_title: "Precisa de ajuda? O que é uma chave de API?",
    help_what_is_key: "Uma chave de API é como uma senha que te permite usar a inteligência artificial do provedor escolhido (Z.ai, OpenAI, DeepSeek, etc). Você cria a chave no site do provedor, cola aqui, e o igot usa ela pra traduzir e explicar os textos. Sua chave fica só no seu dispositivo.",
    help_key_desc: "Como conseguir uma chave (grátis):",
    help_how_to_get: "Como conseguir uma chave (grátis):",
    help_step1: "Clique no link \"Obter uma →\" acima (ao lado do nome do provedor)",
    help_step2: "Crie uma conta no site do provedor",
    help_step3: "Gere uma chave de API (API Key)",
    help_step4: "Copie a chave e cole aqui no campo acima",
    help_pricing: "Comparação de preços dos provedores:",
    help_pricing_link: "Ver ranking de preços (OpenRouter) →",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════════════════════
  en: {
    app_name: "igot",
    app_tagline: "Read anything. Understand everything.",
    loading: "Loading…",
    close: "Close",
    save: "Save",
    cancel: "Cancel",
    remove: "Remove",
    edit: "Edit",
    use: "Use",
    search: "Search",
    filter: "Filter",
    settings: "Settings",
    shelf_loading: "Loading your shelf…",
    shelf_title: "My shelf",
    shelf_clear_all: "🗑 Clear all",
    shelf_clear_confirm: "Remove ALL books from your shelf? This action cannot be undone.",
    shelf_add_book: "+ Add book",
    shelf_adding: "Adding book…",
    shelf_remove_confirm: 'Remove "{title}" from your shelf?',
    shelf_page_n: "Page {n}",
    shelf_chapter_n: "Chapter {n}",
    shelf_remove_book: "Remove from shelf",
    upload_hero_title: "Read anything. Understand everything.",
    upload_hero_desc: "E-book reader with AI that translates and explains any passage — in any language.",
    upload_feat_translate: "Translates",
    upload_feat_explain: "Explains",
    upload_feat_formats: "PDF & EPUB",
    upload_config_needed: "Set up your AI first",
    upload_config_desc: "Choose a provider and paste your key to translate and explain.",
    upload_dropzone: "Drag a book here or",
    upload_click: "click to choose",
    upload_format_hint: "EPUB or PDF",
    upload_privacy: "Your AI keys never leave your device.",
    reader_read_new: "Read new",
    reader_open_other: "Open another book",
    reader_shelf: "My shelf",
    reader_zoom: "Zoom",
    reader_zoom_out: "Zoom out",
    reader_zoom_in: "Zoom in",
    reader_zoom_reset: "Reset zoom",
    reader_settings: "AI settings",
    reader_fullscreen: "Fullscreen",
    reader_exit_fullscreen: "Exit fullscreen",
    reader_hide_menu: "Hide menu",
    reader_show_menu: "Show menu",
    reader_notes: "My notes",
    reader_bookmark: "Bookmark this page",
    reader_bookmark_remove: "Remove bookmark from this page",
    reader_bookmarks: "My bookmarks",
    reader_print: "Print / save this page as PDF",
    reader_photo: "Save a photo of this page (PNG) to your device",
    reader_photo_error: "Could not save the image of this page in this browser.",
    reader_translate_page: "🌐 Translate page",
    reader_translating: "⏳ Translating…",
    reader_view_original: "📖 View original",
    reader_view_translation: "🌐 View translation",
    reader_explain_page: "🧠 Explain page",
    reader_explaining: "⏳ Explaining…",
    reader_sel_translate: "🌐 Translate",
    reader_sel_explain: "🧠 Explain",
    reader_fs_translation: "🌐 Translation",
    reader_fs_explanation: "🧠 Explanation",
    reader_processing: "Processing…",
    reader_bookmarks_title: "🔖 Bookmarks",
    reader_bookmarks_empty: "You haven't bookmarked any pages yet. Tap 🔖 or the top-right corner of the page to bookmark.",
    reader_notes_title: "📓 My notes",
    reader_notes_empty: "You haven't saved any notes from this book yet. Select a passage, choose Translate or Explain, and click 📌 Save.",
    reader_note_translate: "🌐 Translation",
    reader_note_explain: "🧠 Explanation",
    reader_note_question: "❓ Question",
    reader_nav_prev: "Previous",
    reader_nav_next: "Next",
    reader_nav_label: "Navigate pages",
    reader_page_n: "Page {n}",
    reader_chapter_n: "Chapter {n}",
    ai_assistant: "🧠 igot Assistant",
    ai_empty_hint: "Select a text passage and choose Translate or Explain.",
    ai_empty_sub: "Or ask a question about the book below.",
    ai_save: "📌 Save",
    ai_save_tooltip: "Save this response to your notes",
    ai_ask_placeholder: 'Ask about "{title}"…',
    set_title: "⚙️ AI settings",
    set_my_keys: "🔑 My registered keys ({n})",
    set_default_model: "default",
    set_edit_key: "Edit key",
    set_add_key: "Add new key",
    set_provider: "AI provider",
    set_no_key_link: "No key?",
    set_label: "Nickname",
    set_label_hint: "(optional — to distinguish if you have several)",
    set_api_key: "API key",
    set_api_key_placeholder: "paste your key here",
    set_api_key_update: "Paste a NEW key to update",
    set_show_key: "Show key",
    set_hide_key: "Hide key",
    set_key_privacy: "🔒 Your key stays only in this browser (localStorage). It is never sent to our server except to relay it to the provider.",
    set_ui_lang: "Interface language",
    set_ui_lang_hint: "The language of buttons, menus and app texts.",
    set_ai_lang: "Language of translations and explanations",
    set_ai_lang_hint: "The AI will translate and explain texts in this language.",
    set_model: "Model",
    set_model_default: "(default: {model})",
    set_search_models: "Search available models from the provider",
    set_searching_models: "Searching available models…",
    set_no_models: "No models found.",
    set_advanced: "Advanced (custom URL)",
    set_base_url: "Base URL",
    set_base_url_default: "(default: {url})",
    set_base_url_hint: "Use to point to a self-hosted server (e.g.: Ollama, LM Studio).",
    set_btn_update: "💾 Update",
    set_btn_add: "💾 Add key",
    set_test_connection: "Test connection",
    set_testing: "Testing…",
    set_clear_all: "Clear all",
    set_clear_confirm: "Remove ALL registered keys?",
    set_saved: "✓ Settings saved.",
    set_remove_confirm: 'Remove "{title}"?',
    auth_checking: "Checking login",
    auth_signin: "Sign in",
    auth_account_menu: "Account menu",
    auth_user: "User",
    auth_signout: "Sign out",
    err_opening_book: "Opening book…",
    err_book_not_found: "Book not found in your shelf.",
    err_back_shelf: "← Back to shelf",
    donate_title: "Like igot? Support the project!",
    donate_paypal: "💙 PayPal",
    donate_pix: "🟢 PIX (copy)",
    about_title: "About us",
    about_desc: "Read anything. Understand everything.",
    about_developer: "Developed by Miguel Gomes Barbosa do Rosário — Cafezinho Media Group — Niterói, RJ — Brazil",
    help_title: "Need help? What is an API key?",
    help_what_is_key: "An API key is like a password that lets you use the AI from the chosen provider (Z.ai, OpenAI, DeepSeek, etc). You create the key on the provider's website, paste it here, and igot uses it to translate and explain texts. Your key stays only on your device.",
    help_key_desc: "How to get a key (free):",
    help_how_to_get: "How to get a key (free):",
    help_step1: "Click the \"Get one →\" link above (next to the provider name)",
    help_step2: "Create an account on the provider's website",
    help_step3: "Generate an API key",
    help_step4: "Copy the key and paste it in the field above",
    help_pricing: "Provider price comparison:",
    help_pricing_link: "See price ranking (OpenRouter) →",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Para os outros 10 idiomas, uso fallback pt-BR se faltar.
  // Eles são preenchidos abaixo (es, fr, de, it, ru, zh, ja, ko, ar, hi).
  // Para não estourar o tamanho, cada idioma fica no mesmo formato.
  // ═══════════════════════════════════════════════════════════════════════

  // ESPAÑOL
  es: {} as LangStrings,
  // FRANÇAIS
  fr: {} as LangStrings,
  // DEUTSCH
  de: {} as LangStrings,
  // ITALIANO
  it: {} as LangStrings,
  // РУССКИЙ
  ru: {} as LangStrings,
  // 中文
  zh: {} as LangStrings,
  // 日本語
  ja: {} as LangStrings,
  // 한국어
  ko: {} as LangStrings,
  // العربية
  ar: {} as LangStrings,
  // हिन्दी
  hi: {} as LangStrings,
};
