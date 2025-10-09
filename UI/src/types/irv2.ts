/**
 * IR v2 Types - Layout-aware intermediate representation for documents.
 * 
 * This module defines the TypeScript types for the new IR v2 system that preserves
 * document structure, layout, and formatting information.
 */

export interface DocumentMeta {
  title?: string;
  author?: string;
  created?: string;
  modified?: string;
  pages: number;
  word_count: number;
}

export interface Anchor {
  page: number; // 1-based
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
}

export interface Span {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  link?: string;
  lang?: string;
}

export interface Heading {
  level: number; // 1-6
  spans: Span[];
}

export interface Paragraph {
  spans: Span[];
}

export interface ListItem {
  level: number; // 0-based nesting
  ordered: boolean;
  spans: Span[];
}

export interface Cell {
  blocks: (Paragraph | ListItem | Heading)[];
  colspan?: number;
  rowspan?: number;
  dir?: 'ltr' | 'rtl';
}

export interface Row {
  cells: Cell[];
}

export interface Table {
  rows: Row[];
}

export interface Figure {
  image_id: string;
  caption?: Paragraph;
  anchor?: Anchor;
}

export interface Textbox {
  blocks: (Paragraph | ListItem | Heading)[];
  anchor?: Anchor;
}

export interface Header {
  blocks: (Paragraph | ListItem | Heading)[];
}

export interface Footer {
  blocks: (Paragraph | ListItem | Heading)[];
}

export type Block = Heading | Paragraph | ListItem | Table | Figure | Textbox;

export interface Section {
  index: number;
  header?: Header;
  footer?: Footer;
  blocks: Block[];
}

export interface Document {
  meta: DocumentMeta;
  sections: Section[];
}

export interface GlossaryEntry {
  source: string;
  target: string;
  case_sensitive: boolean;
  exact: boolean;
}

export interface TranslationStats {
  paragraphs: number;
  tables: number;
  figures: number;
  headers: number;
  footers: number;
  sections: number;
  word_count: number;
}

export interface ParseResult {
  document: Document;
  lang: string;
  stats: TranslationStats;
}

export interface ExportRequest {
  source_ir: Document;
  target_ir?: Document;
  layout?: 'sequential' | 'side_by_side';
  format?: 'docx';
  glossary?: GlossaryEntry[];
  model?: string;
}
