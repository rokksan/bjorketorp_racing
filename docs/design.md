# Björketorp: en sammanhållen omarbetning

## Riktning

En svensk gårdsmarknad som skulle kunna bo i ett varmt 16-bitsspel. Alla figurer och miljöer är original, ritade på ett gemensamt pixelrutnät. Paletten är begränsad till salvia, skogsgrönt, smörgul jord, tegelrött och dimblått. Hönorna har tydliga silhuetter, riktiga växlande ben och vingar, och samma bildrutestorlek.

Den tidigare isometriska presentationen ersätts med en mer lättläst vy snett ovanifrån. Körvägen är ljus och sammanhängande; lågmälda kantstolpar och vita pilar visar riktningen. Det gör det möjligt att läsa banan innan man behärskar den.

## Inspiration

- [Super Mario Kart, Nintendo](https://www.nintendo.com/en-gb/Games/Super-Nintendo/Super-Mario-Kart-279580.html): korta lopp och lättläst racing. [Originalmanualen](https://www.nintendo.co.jp/clvs/manuals/common/pdf/CLV-P-SAAFE.pdf) beskriver föremål och tävlingsformer. Här används idéerna om tydliga föremålsroller och återkommande medaljmål, med egna regler och resurser.
- [Stardew Valley, officiell presentation](https://www.stardewvalley.net/about/): inspiration till känslan av en personlig gård och gradvis utveckling. I Hönsrace är den egna gården menyn och det synliga resultatet av tidigare lopp.

Ingen grafik, musik, melodi eller karaktär från inspirationsspelen används.

## Spelcykel

Välj höna och bana → tävla och samla majs → få mynt och medalj → investera i gården → öppna nya rundor och personliga mål.

En spelare som inte vinner ska ändå göra framsteg. Nya banor kräver genomförda lopp, inte segrar. Uppgraderingarna är begränsade till tre nivåer per gren, så att förmågan att köra och använda spurt fortfarande spelar roll. Tidsträning standardiserar både höna och utrustning, så rekord inte blir ett mått på hur mycket pengar man har tjänat. Ett personbästa sparar en kompakt spökinspelning som kan jagas under nästa försök.

## Banan är en regel, inte bara en bild

`core.buildTrack()` skapar en sluten spline. Grafik, AI, vägprojektion, sektorer och hinderpositioner använder samma data. Dekorernas hela bildyta måste ligga utanför vägkorridoren och dess marginal. Det gäller även trädkronor och tak, inte bara markankaret. Avsiktliga hinder är separata från dekor och ligger nära kanten, så idealspåret går att läsa.

Tre miljöer ger en stigande kurva: bred vårmarknad, böljande sommaräng och teknisk höstlund. Marknaden har stånd och odlingar, ängen en damm och öppna ytor, och lunden varma äppelträd.

## Ljud

Fem originalarrangemang: gård, marknad, äng, lund och resultat. Musikmotorn schemalägger korta toner i förväg med Web Audio-klockan, oberoende av grafikens bildfrekvens. Bas och melodi får olika vågformer; arpeggion ligger i ett separat register och lätt stereopanorama. Slagverk använder syntetiska toner och filtrerat brus. Fåglar och vind ligger på en egen volymbuss.

Föremålen har skilda ljudformer: stigande fartton, glasklar sköld, fallande lerljud. Majs, varv och målgång har egna signaler. Den sista rundan höjer musiktempot utan att ändra fysiken.

## Verifiering och kvarvarande finjustering

- Simulerade hela lopp på alla banor och med alla hönor.
- Rörelsebaserad varvräkning, baklängeskörning, paus, spurt och jämförbara tidssteg.
- Spökinspelningar valideras och interpoleras; föremål kan bara samlas en gång per varv, och tömd spurt kan inte fyllas medan knappen hålls nere.
- Lopp → resultat → lokal sparning → uppgradering genom den verkliga kontrollkoden i DOM-testskal.
- Sparfilernas validering, ekonomi, kontrakt, uppgraderingstak och engångsutbetalningar.
- Hel dekorrektangel kontrollerad mot körfält på alla banor.
- Webbläsarkontroll av gård, verkstad, ljudpanel, start och paus; visuell kontroll vid desktop- och mobilstorlek.
- Ljudets schemaläggning och effekter testade med Web Audio-testskal. Ljudstart och provljud har körts i webbläsaren utan konsolfel. Slutlig subjektiv mixning kräver lyssning och längre spelpass.

Svårighetskurvan och ekonomin är första balansvärden, inte påstått färdigoptimerade. Nästa balanspass bör mäta nybörjares varvtider, hur ofta de hinner använda föremål och hur många lopp det tar att köpa nästa uppgradering.

## Miljörevision: regn och nattfest

Bana 2 är ombyggd till en lång S-form med hårnålar; bana 3 till en ojämn, teknisk skördefestbana. Regnbanan använder dämpade grågröna toner, diken, traktorer och en liten lada. Nattbanan använder blåviolett, varma lyktor, pumpor, en smal träbro och ett öppet loggolv. Den torra mittlinjen går att följa runt lerhindren. Bron begränsar den körbara bredden och tillåter inga genvägar längs räcket.

Namngivna publikpar grälar och slåss i dammoln, utan blod. Publikens hela sprite inklusive flaska och gungning reserveras vid placering så att dekorationer och publik inte fyller körfältet. Dialogen är DOM-text ovanför spelplanen, inte en kortvarig canvasbubbla. Gräl och slagsmål har egna syntetiska ljud. Regnbanan har regn och traktorpuls; nattbanan snabbare skördedans och syrsliknande pip. Inga inspelade röster.
