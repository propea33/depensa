# gym-scraper

Scraper quotidien des prix mensuels des abonnements gym pour Depensa.
Résultat publié dans `data/gym-prices.json`.

## Gyms couverts

- Éconofitness
- Pro Gym
- YMCA
- World Gym
- Energie Cardio

## Fonctionnement

- Exécution quotidienne via GitHub Actions.
- Extraction des prix mensuels en CAD.
- Si scrape ambigu/non CAD/hors plage réaliste: fallback au dernier prix valide (sinon fallback local).
- Détection de variation de prix avec:
  - `previous_price`
  - `delta`
  - `price_drop`

## Structure

```text
gym-scraper/
├── scraper/scrape.py
├── data/gym-prices.json
├── tests/test_scraper.py
├── requirements.txt
└── README.md
```

## Lancer localement

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scraper/scrape.py
```

## Intégration Depensa

Depensa lit ce fichier via:

`https://raw.githubusercontent.com/propea33/depensa/main/gym-scraper/data/gym-prices.json`
