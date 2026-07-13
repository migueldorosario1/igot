/**
 * Tipos compartilhados entre componentes da UI.
 *
 * `SelectionAction` é o "evento" que viaja do Reader pro AIPanel:
 * quando o leitor seleciona um trecho e escolhe uma ação (Traduzir/Explicar),
 * o Reader monta este objeto e o AIPanel consome.
 */

export type SelectionActionType = "translate" | "explain";

export interface SelectionAction {
  /** O que fazer com o texto selecionado. */
  type: SelectionActionType;
  /** O trecho selecionado. */
  text: string;
  /** Em que idioma o leitor quer a resposta (ex.: "pt-BR"). */
  targetLang: string;
  /** Onde o trecho está (capítulo), pra eventual contexto. */
  chapterId?: string;
}
