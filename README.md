# QG Bags — tema Shopify V2

Tema del nuovo sito QG Bags, costruito su **Horizon 4.5.0** di Shopify (licenza in `LICENSE.md`: uso consentito per il negozio QG Bags, non rivendibile).

Stile della **bozza home A** ("Blu QG, Jost"): blu QG `#1b478e`, avorio `#f6f3f0`, font Jost, payoff *Intelligenza Artigianale — Tu immagini. Le nostre mani realizzano.*

## Sezioni QG (tutte modificabili dall'editor del tema)

| Sezione | Cosa fa |
|---|---|
| `qg-hero` | Apertura con tre foto, velo scuro, titolo, sottotitolo, bottone |
| `qg-modelli` | Modelli (Travel, City, Grace, Beauty e Pochette), un blocco per modello |
| `qg-tre-passi` | "La tua QG Bag in 3 passi": tessuto, manico, ricamo |
| `qg-piu-amate` | Prodotti pronti da una collezione; sottotitolo dal metafield `custom.descrizione_breve` |
| `qg-borsino` | Il borsino: video 16:9 e quattro foto |
| `qg-film` | Il film a tutta larghezza con comandi e audio; il video si sceglie dall'editor |
| `qg-atelier` | "Fatte a mano": foto e testo su avorio |
| `qg-newsletter` | Iscrizione newsletter (modulo clienti Shopify) e garanzie |

Stili comuni in `assets/qg.css`, caricato da `layout/theme.liquid`. La home è in `templates/index.json`.

## Regole

- Si lavora solo sul negozio di sviluppo **qgbags-v2.myshopify.com**, mai su qgbags.com.
- Si carica su un tema **non pubblicato**, ad esempio:
  `shopify theme push --store qgbags-v2 --unpublished --theme "QG V2"`
- Foto e video si caricano dall'admin (Contenuti > File) e si scelgono nell'editor: non stanno nel repo.

## Da fare

- Caricare foto e film e collegarle nelle sezioni.
- Collegare "Inizia a creare" al configuratore.
- Riprendere la prova configuratore/carrello (`qg-configuratore-prova`) dalla cartella Bags.
