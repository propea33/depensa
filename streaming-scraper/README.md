# streaming-scraper

Scraper quotidien des prix des abonnements streaming pour Depensa.
Résultat publié dans `data/streaming-prices.json`.

## Services couverts

- Netflix
- Amazon Prime
- Crave
- Disney+
- Illico+
- Tou.tv
- Apple TV+
- Paramount+
- Tubi

## Fonctionnement

- Exécution quotidienne via GitHub Actions (`.github/workflows/scrape.yml`).
- Pour chaque service: tentative de scrape HTTP + extraction du prix mensuel.
- Si le scrape échoue: fallback automatique sur le prix de la veille, sinon valeur par défaut.
- Détection de baisse de prix avec champs:
  - `previous_price`
  - `delta`
  - `price_drop`

## Structure

```text
streaming-scraper/
├── .github/workflows/scrape.yml
├── scraper/scrape.py
├── data/streaming-prices.json
├── tests/test_scraper.py
├── requirements.txt
└── README.md
```

## Lancer localement

```bash
git clone https://github.com/TON-USER/streaming-scraper.git
cd streaming-scraper
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scraper/scrape.py
```

Le JSON final est écrit dans `data/streaming-prices.json`.

## Intégration Depensa

Depensa lit ce fichier via:

`https://raw.githubusercontent.com/propea33/streaming-scraper/main/data/streaming-prices.json`

Si le repo n'est pas encore publié, l'app utilise automatiquement ses valeurs fallback.
