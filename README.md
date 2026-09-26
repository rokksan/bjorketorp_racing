# Hönsrace 2000

Ett fristående racingspel i Björketorp, med egen pixelgrafik, licensierad bluegrass och en gård som växer mellan loppen. Vanilla JavaScript och Canvas; inga externa tjänster, byggsteg eller paket behövs för att spela.

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
| `js/audio.js` | Fyra lokala CC BY-musikfiler, atmosfär och ljudeffekter |
| `game.js` | Menyer, tangentbord/pekare, sparning och en animationsloop |
| `style.css` | Responsiv gårdsmeny, HUD och dialoger |
| `tools/export-assets.cjs` | Export av grafikens pixelprimitiver till återanvändbara SVG-filer |
| `assets/asset-manifest.json` | Verkliga resurser, bildrutor och stilregler |

Simuleringen körs med fasta 120 steg per sekund. All statisk bangrafik cachas. Samma spline används för banans ritning, körgränser, AI och varvräkning. Dekorernas hela visuella rektangel kontrolleras mot banan. Varv kräver fyra ordnade sektorer; att backa över mållinjen ger inget gratisvarv.

Ljud aktiveras först efter en interaktion. Separata volymer finns för musik, effekter och atmosfär. Musiken spelas från lokala MP3-filer via webbläsarens ljudspelare, utan syntetiska musikstämmor. Se [musikcredits](assets/audio/ATTRIBUTION.md). Paus stoppar både schemaläggning och aktiva ljudkällor.

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

### Bonncyberpunk från Björketorp
Svets-Greta har svetsbrillor och verktygsbälte, Raketragge dubbla gasoltuber, Plåt-Pär skrotpansar och Ägg.exe en hembyggd terminal. Utrustningen syns i porträtt, lopp och på gården. Sparade karaktärsval och egenskaper behålls. Nya originalrepliker blandar fiber i ladan, buss på torsdag och hemmatrimmad teknik med den gamla Kladdis-dialogen.

På breda skärmar söker pratbubblorna en fri yta nära talaren, helt utanför körfältet och utan att täcka andra bönder. Om ingen yta finns, eller på mobil, används en större pratbubbla ovanför banan med en tunn linje till talaren. En bubbla visas åt gången.

### Bygdedans och kommunal undergång
Publikens pratlinjer och dekorativa bubbelstreck är borttagna. Namnet i bubblan och en liten markering över bonden identifierar talaren. Alla uppgraderingar har tre egna nivånamn, med samma priser och effekter som tidigare.

Musiken är omkomponerad till fem egna melodier: bakfyllevals, svängig konkursmarknadsdans, röddiesellunk i regnet, sista dansen före utmätning och en målgångsvals. Två lätt ostämda, lågpassfiltrerade stämmor ger en dragspelsliknande klang med längre anslag; växelbas, ackordslag och trummor ersätter den tidigare fyrkantsmelodin och de ständiga arpeggiona. Ljuden syntetiseras fortfarande lokalt; inga externa inspelningar behövs.

Miljöerna innehåller nu lagade husvagnar, brädade småhus, flaskbackar och sovande festprissar i buskar med tydliga Z-symboler. Samma kontroll av hela dekorationsytan håller dem utanför körfältet. Banorna spelar nu Hillbilly Swing, River Valley Breakdown och Corncob. Gården och resultatskärmen spelar Still Pickin.

Publikens dialogpanel och långa fanklubbsrepliker är borttagna ur loppet. Korta svordomar syns bara i slagsmålsmolnen; de påverkar aldrig sidlayouten. Skrotbilar med 240-, 740- och 850-inspirerade silhuetter är cirka två bondehöjder långa. Startmenyn har en tecknad plåtkrock med små lågor. Alla ritade flaggor använder svenska färger och kors.

Banjoriktningen har skruvats vidare till 208–228 BPM och genomgående sextondelsplock. Banjon använder nu Karplus–Strong-strängsyntes med ett kort anslag och avklingande resonans, i stället för tre oscillatorpip. Fiolen tar mer bakgrundsroll och lämnar plats för banjosolon. Användarens referens är YouTube-videon “Banjo Music (VERY INTENSE)”; inga ljud eller melodier har hämtats från videon.

## Bygdecup, trimning och Kladdis

Kommunmästerskapet räknar pallplatser i ordningen marknad → lerbana → nattbana. Gårdslopp på valfri svårighet räknas; tidsträning gör det inte. Slutförd cup ger 150 extra mynt, en sparad titel och en pokal på gården.

Fyra namngivna rivaler har olika fart och linjeval. Skuldboken visar hur ofta du slagit dem. Verkstaden har gratis, utbytbara trimval med nackdelar, ovanpå befintliga köpta uppgraderingar. Trimning är avstängd i tidsträning. En kontrollerad sladd följd av upprätning ger en kort fartbonus.

Crossföraren har nummer 49 och kör runt hela banan. Efter två sekunders varning gör han en tre sekunder lång burnout som hinder och sprutar kortlivad lera. I tidsträning är crossen endast visuell. Rörelse och hinder följer loppets klocka och paus; reducerad rörelse minskar lerpartiklarna. Publiken har korta pratbubblor utan streck eller layoutförskjutningar.

## Stridsprototyp: Skrotkriget

Välj Skrotkriget under Spelform. Tre 960×600-banor med följkamera och minimap: Skrotkriget, Torvträsket och Flygrakan. Två varv, WASD/pilar, mus/klick, R omladdning, Shift spurt och Space föremål.

Fyra vapen med olika bärvikt, rekyl och träffeffekt: hagel knuffar brett, pistol dränerar spurt, studsare bryter boost på långt håll och potatiskanon gör områdesträffar med fyra sekunders mosfält. Även skytten påverkas av mos och närliggande explosioner. Rivalerna använder var sitt vapen.

Varje målgång ger ett mästerskapssteg för valt vapen. Tre steg ger en nivå och 6 % kortare omladdning, max tre nivåer. Progressionen sparas separat från mynt, rekord och cup. Alla vapen och banor kan väljas direkt.

Korta inspelade skott, mekanisk omladdning och tre kackelvarianter; potatiskanonen har bearbetade puff- och nedslagsljud. Källor och redigeringar finns i assets/audio/ATTRIBUTION.md. Inga nya publikrop.

Validera med node tests/combat.test.cjs samt game, audio och lifecycle-testsviterna.

Torestorps kött och krut finns som egen flik och via startmenyn. Alla fyra vapen kan väljas gratis. Hemkört i slutstycket kostar 120/300/650 mynt och minskar omladdning med 5 procentenheter per nivå; Svågerns axelprotes kostar 100/260/580 och minskar egen rekyl med 12 % per nivå. Tre nivåer per uppgradering och vapen. Köpt trim kombineras med mästerskap. Vapenval, bankortens stridsbaneval och köp sparas lokalt; äldre sparningar migreras utan kostnad eller förlorad progression.
