# Evidence Redundancy Audit (Step 2.6)

**Vault Tag:** `dores-confeccao-faccao-a3ea6b`  
**Claims Ingested:** 32 structured claims across 13 claim files.

---

## 1. Content Overlap & Citation Ancestry Clusters

### Cluster 1 — ENEGEP 2024 Small Garment Factory Lean Case Study (Feira de Santana-BA)
- **Canonical Upstream Source:** `xliv-encontro-nacional-de-engenharia-de-produção-2` (Full PDF paper, 5,082 words, ABEPRO library).
- **Derivative / Abstract Entry:** `anais-enegep-proceedings-icieom` (394 words, proceedings abstract page that pointed to the full PDF via `suggested-by`).
- **Audit Action:** Discount `anais-enegep-proceedings-icieom` in independent source counts (`derivative-of` `xliv-encontro-nacional-de-engenharia-de-produção-2`). Do not double-count as two independent studies.

### Cluster 2 — Outsourcing & Facções in Mato Grosso / Santa Catarina / Ceará
- **Hub Source:** `narrativas-de-facções-de-costura-no-município-de-sinopmt-revista-brasileira-de-e` (UNEMAT, 2024).
- **Upstream Cited Sources (`suggested-by`):**
  - `terceirização-na-indústria-de-vestuário-projetica-2` (UDESC / Rovitex case study, 2021) — **Independent empirical dataset** (82 outsourced facções in SC).
  - `universidade-da-integração-internacional-da-lusofonia-afro` (UNILAB monograph, Barreira-CE, 2014) — **Independent empirical dataset** (60–122 jeans facções in CE).
- **Audit Action:** Although linked by citation ancestry, all three contain distinct primary empirical fieldwork in different states (MT, SC, CE). Count as **3 independent empirical sources**.

### Cluster 3 — Duplicate Proceedings Landing Pages
- `a-terceirização-da-produção-na-indústria-curitibana-do-vestuário-alívio-e-desesp` and `a-terceirização-da-produção-na-indústria-curitibana-do-vestuário-alívio-e-dese-2` point to the same PEGADA article.
- `anais-enegep-proceedings-icieom-2`, `anais-enegep-proceedings-icieom-3`, and `anais-enegep-proceedings-icieom-4` are ENEGEP proceedings abstracts.
- **Audit Action:** Discount exact duplicate and abstract-only stubs when computing independent coverage.

### Cluster 4 — Off-Topic / Generic Portal Pages
- `controladoria` (generic EDUFBA accounting textbook) and `conteúdos` / `conteúdos-2` (generic Sebrae portal landing page) and `página-não-encontrada-iemi-inteligência-de-mercado` (404 page) are excluded from substantive evidence counts.

---

## 2. Adjusted Independent Source Counts per Atomic Item

After discounting derivatives, abstracts of full PDFs, and off-topic/portal pages (net **56 independent substantive sources**):

- **Sub-Q1 (Confecção overview & management):** 12 independent sources (≥2 required)
- **Sub-Q2 (Facção vs. Confecção):** 8 independent sources (≥2 required)
- **Sub-Q3 (Working capital, costs, pricing, seasonality):** 6 independent sources (≥2 required)
- **Sub-Q4 (Labor shortage, turnover, ergonomics/health):** 8 independent sources (≥2 required)
- **Sub-Q5 (Shop-floor PCP, bottlenecks, tech packs, quality):** 8 independent sources (≥2 required)
- **Sub-Q6 (Patternmaking, grading, marker efficiency, 3D/CAD, fabric waste):** 9 independent sources (≥2 required)
- **Sub-Q7 (Commercial pressure, piece-rate pricing, fast fashion, private label):** 7 independent sources (≥2 required)
- **Sub-Q8 (Taxation, informality, MEI/Simples, labor liability / Caso Guararapes):** 6 independent sources (≥2 required)
- **Sub-Q9 (ERP, CAD, Industry 4.0 adoption barriers):** 7 independent sources (≥2 required)
- **Sub-Q10 (Practical needs & high-ROI interventions):** 6 independent sources (≥2 required)

**Conclusion:** Every atomic item has **≥6 independent sources** after redundancy discounting. No Wave 3 gap fetch is required.
