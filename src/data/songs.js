export const GENRES = ['Gospel', 'MPB', 'Rock', 'Sertanejo', 'Pagode', 'Pop', 'Forró'];

export const INITIAL_TAGS = ['Gospel', 'Adoração', 'MPB', 'Rock', 'Sertanejo', 'Pagode', 'Pop', 'Forró', 'Louvor'];

export const INITIAL_SONGS = [
  {
    id: '1',
    title: 'Oceans (Where Feet May Fail)',
    artist: 'Hillsong United',
    key: 'D',
    capo: 0,
    tags: ['Gospel', 'Adoração'],
    bpm: 68,
    createdAt: new Date('2024-01-01').toISOString(),
    content: `Verso:
[D]You call me out u[A]pon the wa[Bm]ters
The great un[G]known where feet may [D]fail
And there I [A]find You in the [Bm]mystery
In oceans [G]deep my faith will [D]stand

Refrão:
[Bm]And I will [G]call upon Your [D]name
And keep my [A]eyes above the [Bm]waves
When oceans [G]rise, my soul will [D]rest in Your em[A]brace
For I am [Bm]Yours and [G]You are [A]mine

Verso 2:
[D]Your grace a[A]bounds in [Bm]deepest waters
Your sove[G]reign hand will be my [D]guide
Where feet may [A]fail and fear sur[Bm]rounds me
You've never [G]failed and You won't [D]start now

Refrão:
[Bm]And I will [G]call upon Your [D]name
And keep my [A]eyes above the [Bm]waves
When oceans [G]rise, my soul will [D]rest in Your em[A]brace
For I am [Bm]Yours and [G]You are [A]mine

Ponte:
[Bm]Spirit lead [G]me where my trust [D]is without [A]borders
Let me walk [Bm]upon the waters [G]wherever You would [D]call me [A]
Take me dee[Bm]per than my feet [G]could ever [D]wander
And my faith [A]will be made [Bm]stronger
In the pre[G]sence of my [A]Savior`
  },
  {
    id: '2',
    title: 'Grande é o Senhor',
    artist: 'Diante do Trono',
    key: 'G',
    capo: 0,
    tags: ['Gospel', 'Adoração'],
    bpm: 76,
    createdAt: new Date('2024-01-02').toISOString(),
    content: `Verso:
[G]Grande é o Se[D]nhor e mui[Em]to digno de lou[C]vor
[G]Grande é o Se[D]nhor e a sua [C]grandeza é [G]insu[D]perável

Pré-Refrão:
[G]Canta mi[Em]nha al[Am]ma
[D]Canta ao Se[G]nhor
[Em]Exalta [Am]Seu nom[D]e que é ma[G]ior

Refrão:
[C]Grande é o Se[G]nhor
[D]Grande é o Se[Em]nhor
[C]Grande é o Se[D]nhor e muito dig[G]no de [D]louvar

Verso 2:
[G]Sua bondade [D]nunca cessa[Em]rá
[C]Seu amor e[G]terno e[D]ra[G]
[G]Sua misericór[D]dia é nova a ca[Em]da manhã
[C]Grande é a Tua fi[D]delidá[G]de`
  },
  {
    id: '3',
    title: 'Evidências',
    artist: 'Chitãozinho e Xororó',
    key: 'C',
    capo: 0,
    tags: ['Sertanejo'],
    bpm: 80,
    createdAt: new Date('2024-01-03').toISOString(),
    content: `Verso:
[C]Eu sei que você não me a[G]ma
[Am]Essa é a lei do mais fra[Em]co
[F]Eu sei que você quer que eu [C]entenda
[G]Que eu saia da sua vi[C]da

Verso 2:
[C]Mas eu amo você demais[G]
[Am]Por isso insisto e não [Em]paro
[F]Você me pede pra es[C]quecer
[G]Como se isso fosse fá[C]cil

Refrão:
[F]Evidên[C]cias mil me convencem
[F]Que você [G]não me que[C]r
[F]Evidên[C]cias mil me alertam
[F]Que devo te es[G]quecer

Ponte:
[C]Mas eu sei que te a[G]mo
[Am]E não posso dei[Em]xar
[F]Que você vá em[C]bora assim
[G]Da minha vi[C]da`
  },
  {
    id: '4',
    title: 'Como é Grande o Meu Amor por Você',
    artist: 'Roberto Carlos',
    key: 'F',
    capo: 0,
    tags: ['MPB', 'Pop'],
    bpm: 72,
    createdAt: new Date('2024-01-04').toISOString(),
    content: `[F]Como é gran[C]de o meu amor por [F]você
[Bb]Ninguém é ca[C]paz de medir
[F]Como é gran[C]de o meu amor por [F]você

[Bb]É infinito [F]não vai ter fim
[C]É maior do que o [Bb]mar
[F]Como é gran[C]de o meu amor por [Bb]você
E o quanto [C]eu sei que vou te a[F]mar

[F]Onde quer que eu va[C]já
[Bb]Você estará em [F]mim
[Bb]Fazendo sempre parte [F]de mim
[C]Do meu amor que não tem [F]fim

[F]Como é gran[C]de o meu amor por [F]você
[Bb]Ninguém é ca[C]paz de medir
[F]Como é gran[C]de o meu amor por [F]você`
  },
  {
    id: '5',
    title: 'Garota de Ipanema',
    artist: 'Tom Jobim e Vinícius de Moraes',
    key: 'F',
    capo: 0,
    tags: ['MPB'],
    bpm: 116,
    createdAt: new Date('2024-01-05').toISOString(),
    content: `[F]Olha que coisa mais [G7]linda
Mais cheia de [Gm]graça
É ela a me[C7]nina
Que vem e que [F]passa
Num doce ba[Bb7]lanço
Caminho do [F]mar

[F]Moça do cor[G7]po dourado
Do sol de Ipa[Gm]nema
O seu balançado [C7]é mais que um poema
É a coisa mais [F]linda que eu já [Bb7]vi pas[F]sar

[D]Ah, por que estou tão so[F#m]zinho?
[G]Ah, por que tudo é tão [Bbm]triste?
[Eb]Ah, a beleza que e[Am]xiste
[D]A beleza que não [Dm]é só minha
Que também [G7]passa sozinha

[F]Olha que coisa mais [G7]linda
Mais cheia de [Gm]graça
É ela a me[C7]nina
Que vem e que [F]passa
Num doce ba[Bb7]lanço
Caminho do [F]mar`
  },
  {
    id: '6',
    title: 'Não Pare',
    artist: 'Aline Barros',
    key: 'A',
    capo: 0,
    tags: ['Gospel'],
    bpm: 120,
    createdAt: new Date('2024-01-06').toISOString(),
    content: `Verso:
[A]Não pare de lo[E]uvar
[F#m]Não pare de a[D]dorar
[A]O Seu amor é[E] eterno
[D]Para sempre du[E]rará

Verso 2:
[A]Não pare de can[E]tar
[F#m]Não pare de o[D]rar
[A]Ele é o Deus[E] poderoso
[D]Que nunca vai te a[A]bandonar

Refrão:
[D]Aleluia, ale[A]luia
[E]Glória ao Se[A]nhor
[D]Aleluia, ale[A]luia
[E]Glória ao Se[A]nhor

Ponte:
[A]Com todo o meu [E]coração
[F#m]Com toda a minha [D]voz
[A]Eu vou louvar o [E]Senhor
[D]Por toda a minha [A]vida`
  },
  {
    id: '7',
    title: 'Parabéns pra Você',
    artist: 'Tradicional',
    key: 'C',
    capo: 0,
    tags: ['Pop'],
    bpm: 100,
    createdAt: new Date('2024-01-07').toISOString(),
    content: `[C]Parabéns pra vo[G7]cê
Nesta data que[C]rida
Muitas felici[F]dades
Muitos anos de [C]vi[G7]da

[C]Parabéns pra vo[G7]cê
Nesta data que[C]rida
Muitas felici[F]dades
Muitos anos de [C]vida`
  },
  {
    id: '8',
    title: 'Aquieta Minh\'alma',
    artist: 'Ministério Zoe',
    key: 'E',
    capo: 0,
    tags: ['Gospel', 'Adoração'],
    bpm: 64,
    createdAt: new Date('2024-01-08').toISOString(),
    content: `Refrão:
[E]Aquieta mi[B]nha alma
[C#m]Aquieta mi[A]nha alma
[E]Aquieta mi[B]nha alma
[A]Senhor em [B]Ti

Verso:
[E]Por que estás tão [B]abatida
[C#m]Ó minh'alma den[A]tro de mim
[E]Espera no Se[B]nhor
[A]Ainda o louvare[B]i

Ponte:
[C#m]Aquele que sal[A]vou
[E]Aquele que res[B]gatou
[C#m]A ele darei [A]glória
[E]O Deus da minha [B]vida

Tag:
[E]Sou [B]Teu Se[C#m]nhor
Sou [A]Teu Se[E]nhor
[B]Minha vida é [A]Tua Se[B]nhor`
  },
];

export const INITIAL_SETLISTS = [
  {
    id: 'sl1',
    name: 'Culto de Domingo',
    songIds: ['1', '2', '6', '8'],
    createdAt: new Date('2024-01-10').toISOString(),
  },
  {
    id: 'sl2',
    name: 'Ensaio da Banda',
    songIds: ['3', '4', '5'],
    createdAt: new Date('2024-01-11').toISOString(),
  },
];
