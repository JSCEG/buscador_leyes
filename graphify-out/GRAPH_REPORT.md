# Graph Report - 65.-Buscador de Leyes Energía  (2026-06-08)

## Corpus Check
- 64 files · ~430,197 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 865 nodes · 1336 edges · 63 communities (44 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `abbd44a7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 62|Community 62]]

## God Nodes (most connected - your core abstractions)
1. `MobileInterface` - 31 edges
2. `CanvasCapture` - 22 edges
3. `loadGeoJSON()` - 17 edges
4. `MapExporter` - 17 edges
5. `Sustentabilidad / Transición` - 16 edges
6. `renderWebDeck()` - 15 edges
7. `Soberanía / Seguridad` - 15 edges
8. `showStatesLayer()` - 14 edges
9. `ExportUI` - 13 edges
10. `clearSearchBox()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `extractLegalStructureFromPdf()`  [EXTRACTED]
  ingestar_pdf.js → legal-ingest-pipeline.js
- `loadGeoJSON()` --calls--> `createStandardPopup()`  [INFERRED]
  Estilos Institucionales/js/map-config.js → Estilos Institucionales/js/seguimiento-proyectos.js
- `fix()` --calls--> `extractLegalStructureFromText()`  [EXTRACTED]
  fix_rechunk.js → legal-ingest-pipeline.js
- `fix()` --calls--> `rebuildTextFromChunks()`  [EXTRACTED]
  fix_rechunk.js → legal-ingest-pipeline.js
- `rechunk()` --calls--> `extractLegalStructureFromText()`  [EXTRACTED]
  rechunk_leyes.js → legal-ingest-pipeline.js

## Import Cycles
- None detected.

## Communities (63 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (46): supabase, calculateSimilarity(), closeEditModal(), displayAlert(), executeChunkingAlg(), extractTextFromPDF(), extractThemes(), fetchAndRenderManageLaws() (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (45): { createClient }, { extractThemesFromText }, supabase, { createClient }, {
    extractLegalStructureFromText,
    rebuildTextFromChunks
}, fix(), supabase, { createClient } (+37 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (22): buildMapTilerUrl(), clearInsetLayers(), clearInsetLines(), clearInsetMarkers(), clearInsetPolygons(), createGradientPattern(), createInsetMaps(), createInsetToggleButton() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (33): analyzeCentrales(), analyzeLines(), analyzePolygons(), analyzeSubestaciones(), clearAnalysisLayers(), DATA_SOURCES, distancePointToLineKm(), drawConservationFeatures() (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (31): analyzeCentrales(), analyzeLines(), analyzePolygons(), analyzeSubestaciones(), clearAnalysisLayers(), DATA_SOURCES, distancePointToLineKm(), drawConservationFeatures() (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (8): MapExporter, exportMapAsPNG(), exportMapForWord(), isMapTilerActive(), prepareLayoutForExport(), showMapTilerWarning(), updateAllProgressOverlays(), waitForTiles()

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (25): dependencies, dotenv, lunr, lunr-languages, pdf2json, pptxgenjs, @supabase/supabase-js, description (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (24): 1. Proyecto Supabase, 2.1 `leyes` — catálogo de leyes, 2.2 `articulos` — texto de cada artículo, 2.3 `temas` — índice jerárquico de cada ley, 2.4 `user_favorites` — favoritos por usuario, 2.5 `user_notes` — notas por usuario por artículo, 2. Esquema de tablas, 3. Autenticación (+16 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (22): assignPermitsToGCR(), calculateElectricityStats(), clearData(), clearSearchBox(), createElectricityCharts(), createElectricityStatesChart(), createElectricityTechChart(), createFilterCards() (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (21): addCapacityLegend(), addConsumptionLegend(), addLegend(), addMunicipalitiesLegend(), addPIBLegend(), addTotalCapacityLegendTwoColumns(), analyzePresaResources(), createLabelToggleControl() (+13 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (14): attachArticleButtons(), ICONS, injectStyles(), renderAnalisisView(), renderArticulosClave(), renderAtributos(), renderFlujoDiagrama(), renderHero() (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (16): BME (6 menciones), LB (14 menciones), LCNE (2 menciones), LEPE-CFE (3 menciones), LEPE-PEMEX (2 menciones), Ley_Sector_Electrico (14 menciones), LGeo (5 menciones), LPTE (29 menciones) (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.21
Nodes (14): animateValue(), brandColors, chartInstances, DataStore, loadDashboardData(), parseRawData(), populateGCRSelect(), renderMiniMap() (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (9): applyAnchorForces(), applyRepulsionForces(), detectCollisions(), drawLeaderLines(), initializeSmartLabels(), repositionLabels(), SmartLabel, updatePositions() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.19
Nodes (13): analizarEntornoGeoespacial(), closeCrudModal(), getStatusStyles(), loadData(), openCrudModal(), parseData(), renderData(), renderGeneracionCard() (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (15): LB (6 menciones), LCNE (3 menciones), LEPE-CFE (2 menciones), LEPE-PEMEX (3 menciones), Ley_Sector_Electrico (4 menciones), LGeo (1 menciones), LPTE (3 menciones), LSH (4 menciones) (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.21
Nodes (15): calculateGasLPStats(), createGasLPCharts(), createGasLPFilterCards(), createGasLPStatesChart(), createGasLPTypeChart(), displayStatesLayer(), drawGasLPMarkersOnly(), drawGasLPPermits() (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (12): Arquitectura, Base de datos Supabase, Commands, Deep linking, Flujo de arranque, `generate-manifest.js`, graphify, Módulos principales (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (13): Impacto Social / Ambiental, LB (1 menciones), LEPE-CFE (1 menciones), LEPE-PEMEX (1 menciones), Ley_Sector_Electrico (13 menciones), LPTE (1 menciones), LSH (11 menciones), RI-SENER (4 menciones) (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (11): Arquitectura, Base de datos Supabase, Commands, Deep linking, Flujo de arranque, `generate-manifest.js`, Módulos principales, Scripts de mantenimiento de BD (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.23
Nodes (13): calculateGasNaturalStats(), createGasNaturalCharts(), createGasNaturalFilterCards(), createGasNaturalStatesChart(), createGasNaturalTypeChart(), drawGasNaturalMarkersOnly(), drawGasNaturalPermits(), filterGasNaturalPermits() (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.23
Nodes (13): calculatePetroliferosStats(), createPetroliferosBrandChart(), createPetroliferosCharts(), createPetroliferosFilterCards(), createPetroliferosStatesChart(), drawPetroliferosMarkersOnly(), drawPetroliferosPermits(), filterPetroliferosPermits() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (12): background_color, categories, description, display, icons, lang, name, orientation (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (11): Artifacts, Current State, Decisions, Design Direction, Next Steps, Open Questions, Project Memory, Project Overview (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (11): 1. Variables CSS (Design Tokens), 2. Tipografía, 3. Elementos UI, 4. Listas, 5. Imágenes y Figuras, 6. Layout General, Botones, Guía de Estilos Web - Plantilla Institucional SENER 2025 (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (11): BME (6 menciones), Comités, LEPE-CFE (14 menciones), LEPE-PEMEX (14 menciones), Ley_Sector_Electrico (2 menciones), LPTE (1 menciones), LSH (1 menciones), RI-SENER (11 menciones) (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (11): LCNE (3 menciones), Ley_Sector_Electrico (9 menciones), LPTE (4 menciones), LSH (2 menciones), Planeación Vinculante, RI-SENER (7 menciones), RLB (6 menciones), RLGeo (5 menciones) (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (11): BME (27 menciones), LB (1 menciones), LEPE-CFE (1 menciones), LEPE-PEMEX (1 menciones), LPTE (6 menciones), RI-SENER (10 menciones), RLB (1 menciones), RLGeo (1 menciones) (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (8): Colors, Components, Do's and Don'ts, Elevation & Depth, Layout, Overview, Shapes, Typography

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (5): chunksLpte, chunksSener, fs, textLpte, textSener

### Community 37 - "Community 37"
Cohesion: 0.33
Nodes (5): Consejo de Planeación, LPTE (3 menciones), RI-SENER (6 menciones), RLPTE (3 menciones), Temas Transversales en Leyes del Sector Energía

### Community 39 - "Community 39"
Cohesion: 0.40
Nodes (4): dataBuffer, fs, path, pdf

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (4): dataDir, fs, outputFile, path

### Community 41 - "Community 41"
Cohesion: 0.40
Nodes (5): drawElectricityPermits(), getDisplaySheetUrl(), hasValidSheetUrl(), loadAndRender(), updateSheetInfo()

### Community 44 - "Community 44"
Cohesion: 0.50
Nodes (3): createStandardPopup(), GERENCIA_COLORS, SEGUIMIENTO_PROYECTOS_MAPS

### Community 45 - "Community 45"
Cohesion: 0.50
Nodes (3): comites, consejo_planeacion, planeacion_vinculante

### Community 62 - "Community 62"
Cohesion: 0.07
Nodes (52): addArticleCard(), addClosingSlide(), addContentShell(), addCoverFooter(), addCoverSlide(), addInfoRow(), addKeyArticlesSlides(), addLogoPair() (+44 more)

## Knowledge Gaps
- **251 isolated node(s):** `{ createClient }`, `{ extractThemesFromText }`, `supabase`, `{ createClient }`, `supabase` (+246 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Temas Transversales en Leyes del Sector Energía` connect `Community 37` to `Community 13`, `Community 17`, `Community 21`, `Community 29`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `loadGeoJSON()` connect `Community 11` to `Community 2`, `Community 44`, `Community 6`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `loadTotalCapacityAdditionsMap()` connect `Community 11` to `Community 2`, `Community 6`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `loadGeoJSON()` (e.g. with `.showNotification()` and `createStandardPopup()`) actually correct?**
  _`loadGeoJSON()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ createClient }`, `{ extractThemesFromText }`, `supabase` to the rest of the system?**
  _251 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07380520266182698 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05805515239477504 - nodes in this community are weakly interconnected._