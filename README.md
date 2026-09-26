# Hönsrace 2000

Ett fristående racingspel i Björketorp, med egen pixelgrafik, egna chiptunes och en gård som växer mellan loppen. Vanilla JavaScript och Canvas; inga externa tjänster, byggsteg eller paket behövs för att spela.

## Starta

```sh
python3 -m http.server 8000
```

Öppna [localhost:8000](http://localhost:8000). Det går även att öppna `index.html` direkt; lokal sparning kan då variera mellan webbläsare.

## Spela

- **Pilar / WASD:** styr i skärmens riktning. Släpp för att bromsa.
- **Shift:** håll för att spurta. Släpp knappen för att återhämta uthålligheten.
- **Space:** använd ditt föremål. Gult ägg ger fart, blått sköld och brunt lera.
- **Escape:** pausa / fortsätt. Fokusförlust och dolda flikar pausar automatiskt.
- **Pekskärm:** styrkors, spurt och föremålsknapp. Knapparna visas också i smala fönster.

Följ de vita pilarna i tre varv. Majs ger två extra gårdsmynt per korn vid målgång. Gräset bromsar och banans yttre gräns hindrar genvägar genom infielden. De små höbalarna och lerpölarna är avsiktliga hinder vid vägkanten; träd, hus, odlingar och övrig dekor ligger utanför hela körfältet.

## Något att komma tillbaka till

Alla avslutade gårdslopp ger mynt, även en femteplats. Köp kraftfoder, springdojor och vilobo i tre nivåer vardera. Uppgraderingarna påverkar alla hönor. Gården ändrar utseende efter tre och sex köpta nivåer.

- Ängsslingan öppnas efter **2** slutförda gårdslopp.
- En blå halsduk öppnas efter **3** lopp.
- Äppellunden öppnas efter **5** lopp.
- Nio medaljplatser: tre banor × tre svårighetsgrader.
- Guld på alla banor i marknadstempo ger guldhalsduken.
- Fyra återkommande uppdrag ger extra belöningar, som hämtas i gårdsboken.
- Tidsträning körs solo med standard-Greta, utan uppgraderingar eller föremål. Den ger separata rekord och sparar ditt personbästa som en spökhöna att tävla mot. Inga mynt eller uppdragspoäng delas ut.

Gården sparas lokalt under `bjorketorp-farm-v2`. Lopp och segrar från den gamla versionen behålls vid första starten, med upp till 200 startmynt som kompensation. Gamla rekord migreras inte eftersom banorna och fysiken är nya. Om webbläsaren blockerar lagring fungerar spelet under sessionen och visar att gården är tillfällig. Ingen molnsynk finns.

## Kod och originalresurser

| Fil | Ansvar |
| --- | --- |
| `js/core.js` | Ren simulering, banor, AI, progression och validering av sparfiler |
| `js/art.js` | Gemensam palett, pixelrutnät, spriter, miljöer och ritning |
| `js/audio.js` | Fem egna flerspåriga arrangemang, atmosfär och ljudeffekter |
| `game.js` | Menyer, tangentbord/pekare, sparning och en animationsloop |
| `style.css` | Responsiv gårdsmeny, HUD och dialoger |
| `tools/export-assets.cjs` | Export av grafikens pixelprimitiver till återanvändbara SVG-filer |
| `assets/asset-manifest.json` | Verkliga resurser, bildrutor och stilregler |

Simuleringen körs med fasta 120 steg per sekund. All statisk bangrafik cachas. Samma spline används för banans ritning, körgränser, AI och varvräkning. Dekorernas hela visuella rektangel kontrolleras mot banan. Varv kräver fyra ordnade sektorer; att backa över mållinjen ger inget gratisvarv.

Ljud aktiveras först efter en interaktion. Separata volymer finns för musik, effekter och atmosfär. Musiken har melodi, bas, arpeggio och slagverk; sista varvet ökar tempot. Paus stoppar både schemaläggning och aktiva ljudkällor.

## Testa

Node.js 18 eller senare behövs bara för utvecklingstesterna:

```sh
node tests/game.test.cjs
node tests/lifecycle.test.cjs
node tests/audio.test.cjs
node tools/export-assets.cjs
```

Testerna täcker kompletta lopp på alla banor, fyra hönor, sektorer, tidssteg, spurt, skydd mot parkeringsfarming, spökinspelning, ekonomi, engångsutbetalning, uppdrag, sparfilsvalidering, dekoravstånd och resursreferenser. Livscykeltestet kör den riktiga kontrollkoden genom tangentbordsstyrt lopp, resultat, köp och återstart i ett minimalt DOM-testskal. Ljudtestet använder ett Web Audio-testskal för schemaläggning, instrument, effekter, volym och paus.

Se [designbesluten](docs/design.md) och [banöversikten](docs/course-sheet.png). Balansen är en första inställning; långa mänskliga speltester behövs för finjustering av svårighetsgrader, ekonomi och ljudmix.

Publiken är tillbaka: originalets 21 Kladdis-repliker, bönder utanför körfältet och flaskor, äpplen och stövlar med 1,3 sekunders landningsvarning. Kasten träffar även rivaler. Äggskölden skyddar och Pär återhämtar sig snabbare. Tidsträning har publikdialog men inga kast. Ropen har syntetiska retroljud, inte inspelade röster.

### Tre egna miljöer

Marknadsrundan behåller vårsolen. Kladdis leriga långrunda har en ny utdragen hårnålsbana, regn, traktorer, lada, diken och lerhinder. Callheims nattliga skördefest har S-kurvor, en smal träbro, ett öppet loggolv, pumpor och lyktor. Bönderna har rutiga skjortor, lappade hängselbyxor, flaskor och ostadiga rörelser; par grälar och hamnar i tecknade dammoln var trettonde sekund. Publikens namngivna repliker ligger i en större panel ovanför banan i upp till 6,5 sekunder. Minskad rörelse stänger av regnanimation och gungningar.

Bana 2 och 3 har ny geometri: tidigare tider och spökinspelningar för dessa banor pensioneras vid inläsning. Mynt, uppgraderingar, medaljer och upplåsningar behålls. Marknadsrekorden påverkas inte.
