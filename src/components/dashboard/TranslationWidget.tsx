import React, { useCallback, useMemo, useState } from "react";
import { Languages, Sparkles } from "lucide-react";

// TranslationWidget simulates a translation workspace with language detection heuristics and curated outputs.

const defaultSource = "Global collaboration is essential for quickly adapting language services to new markets.";

// Keyword fingerprints for each supported language feed the naive detection heuristic.
const detectionProfiles = [
  {
    code: "en",
    label: "English",
    keywords: ["the", "and", "is", "for", "global", "services"],
  },
  {
    code: "es",
    label: "Spanish",
    keywords: ["el", "la", "para", "servicios", "mercados", "rapidamente"],
  },
  {
    code: "fr",
    label: "French",
    keywords: ["le", "la", "services", "marches", "rapide", "adaptation"],
  },
  {
    code: "de",
    label: "German",
    keywords: ["die", "und", "fur", "dienste", "markte", "schnell"],
  },
  {
    code: "he",
    label: "Hebrew",
    keywords: ["shituf", "olami", "sherutei", "safot", "shvakim"],
  },
  {
    code: "ru",
    label: "Russian",
    keywords: ["globalnoe", "sotrudnichestvo", "servisov", "rynkam", "yazykovykh"],
  },
  {
    code: "zh",
    label: "Chinese",
    keywords: ["quanqiu", "hezuo", "yuyan", "fuwu", "shichang"],
  },
  {
    code: "ar",
    label: "Arabic",
    keywords: ["altaawun", "alamai", "khadamat", "lugha", "aswaq"],
  },
];

// Target dropdown options presented to the user in the UI.
const supportedTargets = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "he", label: "Hebrew" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
];

// Canonical phrase per language; serves as both detection reference and output text when translating.
const languagePhrases: Record<string, string> = {
  en: "Global collaboration is essential for quickly adapting language services to new markets.",
  es: "La colaboracion global es esencial para adaptar rapidamente los servicios linguisticos a nuevos mercados.",
  fr: "La collaboration mondiale est essentielle pour adapter rapidement les services linguistiques a de nouveaux marches.",
  de: "Globale Zusammenarbeit ist entscheidend, um Sprachdienste schnell an neue Markte anzupassen.",
  he: "Shituf peula olami hu kruci behitama mehira shel sherutei safot leshvakim chadashim.",
  ru: "Globalnoe sotrudnichestvo vazhno dlya bystroi adaptatsii yazykovykh servisov k novym rynkam.",
  zh: "Quanqiu hezuo dui xunsu shiying yuyan fuwu dao xin shichang feichang zhongyao.",
  ar: "Altaawun alalami daruri litakyif khadamat allugha bisur3a maa alaswaq aljadeeda.",
};

// Build a dense lookup so every language can translate to every other language without recomputing on demand.
const translations: Record<string, Record<string, string>> = Object.fromEntries(
  Object.keys(languagePhrases).map((source) => [
    source,
    Object.fromEntries(
      Object.keys(languagePhrases)
        .filter((target) => target !== source)
        .map((target) => [target, languagePhrases[target]])
    ),
  ])
);

// Very lightweight language detection based on keyword matches; good enough for demo purposes.
function detectLanguage(text: string) {
  const normalized = text.toLowerCase();
  let best = { code: "und", label: "Unknown", confidence: 0 };

  detectionProfiles.forEach((profile) => {
    const score = profile.keywords.reduce((total, keyword) => {
      return total + (normalized.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > best.confidence) {
      const confidence = Math.round((score / profile.keywords.length) * 100);
      best = { code: profile.code, label: profile.label, confidence };
    }
  });

  return best;
}

// Translation simply swaps in the target phrase unless the pair is unsupported or redundant.
function translate(source: string, from: string, to: string) {
  if (!source.trim() || from === to) {
    return source;
  }

  const lookup = translations[from]?.[to];
  if (lookup) {
    return lookup;
  }

  return `${source}\n\n[Automatic translation unavailable for ${from.toUpperCase()} -> ${to.toUpperCase()}]`;
}

// Main component renders the editing surface, target controls, and translation preview.
export default function TranslationWidget() {
  const [sourceText, setSourceText] = useState(defaultSource);
  const [targetLanguage, setTargetLanguage] = useState("es");
  const detection = useMemo(() => detectLanguage(sourceText), [sourceText]);
  const [translated, setTranslated] = useState(() =>
    translate(defaultSource, detectLanguage(defaultSource).code, "es")
  );

  const handleTranslate = useCallback(() => {
    setTranslated(translate(sourceText, detection.code, targetLanguage));
  }, [sourceText, detection.code, targetLanguage]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold">Translation Workspace</h2>
              <p className="text-xs text-white/60">Explore language detection and side-by-side AI translation.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid flex-1 gap-6 xl:grid-cols-2">
        <section className="flex h-full flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/60 p-4 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm font-medium text-white/80" htmlFor="translation-source">
              Source text
            </label>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">{detection.label}</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                {detection.confidence}%
              </span>
            </div>
          </div>

          <textarea
            id="translation-source"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            className="h-52 w-full flex-1 rounded-md border border-white/10 bg-slate-950/40 p-3 text-sm text-white transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            spellCheck={true}
          />

          <p className="text-xs text-white/50">
            Detection uses heuristics for demo purposes and updates instantly as you type.
          </p>
        </section>

        <section className="flex h-full flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/60 p-4 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white/80" htmlFor="translation-target">
                Target language
              </label>
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <span className="text-xs uppercase tracking-wide text-amber-200/70">Simulated output</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              id="translation-target"
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
              className="w-full flex-1 rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white transition-colors focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 sm:w-48"
            >
              {supportedTargets.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleTranslate}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-500/80 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-500"
            >
              <Sparkles className="h-4 w-4" /> Translate
            </button>
          </div>

          <div className="min-h-[13rem] flex-1 rounded-md border border-white/10 bg-slate-950/40 p-3 text-sm text-white/85 shadow-inner">
            <p className="whitespace-pre-line leading-relaxed">{translated}</p>
          </div>

          <p className="text-xs text-white/50">
            Output comes from a curated phrase bank and mirrors the selected target language.
          </p>
        </section>
      </div>
    </div>
  );
}




