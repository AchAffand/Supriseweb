import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

type Page = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const GALLERY_PHOTOS = [1, 2, 3, 4, 5, 6, 7] as const;

const QUIZ = [
  {
    q: 'Siapa yang paling lucu dan gemes versi aku?',
    options: ['Orang random di jalan', 'Nia', 'Kucing tetangga'],
    correct: 1
  },
  {
    q: 'Kalau aku lagi capek, siapa yang paling pengen aku peluk?',
    options: ['Bantal', 'Nia', 'HP'],
    correct: 1
  },
  {
    q: '"Lopyu" dari aku ke kamu artinya…',
    options: ['Cuma basa-basi', 'Iseng doang', 'Aku sayang banget sama kamu'],
    correct: 2
  }
] as const;

/** Ucapan di kartu bucket virtual — ubah sesuka kamu */
const BUCKET_CARD_MESSAGE =
  'Buat Nia yang suka bucket bunga — ini versi virtualnya dulu ya sayang. Semoga harimu selalu wangi dan berwarna kayak bunga-bunga ini. Lopyuu!';

const QUIZ_WRONG_TEASES = [
  'Sayang, marah nih :(',
  'Netnooooott,coba lagi sayang',
  'Hmm kurang tepat. Aku tunggu sampe besok sayang',
  'Niaa… kok gitu sih, kit heart hati kecilku nih',
  'Salah tapi tetep lucu. Sekali lagi, yang bener yang mana?',
] as const;

function PixelHeartSeal({ className }: { className?: string }) {
  const rows = [
    '  ##   ##  ',
    ' ######### ',
    '###########',
    '###########',
    ' ######### ',
    '  #######  ',
    '   #####   ',
    '    ###    ',
    '     #     '
  ];
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      width={48}
      height={Math.round((48 * h) / w)}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rows.map((row, y) =>
        [...row].map((ch, x) => {
          if (ch !== '#') return null;
          const highlight = x === 2 && y === 1;
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={highlight ? '#ffffff' : '#FF77A8'}
            />
          );
        })
      )}
    </svg>
  );
}

/** PNG transparan (remove.bg) — gerak + ekspresi lewat CSS */
const QUIZ_MASCOT_SRC = `${import.meta.env.BASE_URL}quiz-mascot.png`;

function QuizMascot({ mood }: { mood: 'idle' | 'happy' | 'sad' }) {
  return (
    <div
      className={[
        'quiz-mascot',
        mood === 'happy' ? 'quiz-mascot--happy' : '',
        mood === 'sad' ? 'quiz-mascot--sad' : '',
        mood === 'idle' ? 'quiz-mascot--idle' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      {mood === 'happy' ? (
        <>
          <span className="quiz-mascot__sparkle quiz-mascot__sparkle--a" />
          <span className="quiz-mascot__sparkle quiz-mascot__sparkle--b" />
        </>
      ) : null}
      <img
        src={QUIZ_MASCOT_SRC}
        alt=""
        className="quiz-mascot__img"
        decoding="async"
      />
      {mood === 'sad' ? <span className="quiz-mascot__tear" /> : null}
    </div>
  );
}

function App() {
  const TRANSITION_MS = 1400;
  const SWITCH_AT_MS = 700;

  const [page, setPage] = useState<Page>(0);
  const [transitioning, setTransitioning] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [quizShake, setQuizShake] = useState(false);
  const [quizWrongTease, setQuizWrongTease] = useState<string | null>(null);
  const [bucketCardOpen, setBucketCardOpen] = useState(false);

  const timersRef = useRef<number[]>([]);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const popSfxRef = useRef<HTMLAudioElement | null>(null);
  const transitionSfxRef = useRef<HTMLAudioElement | null>(null);
  const mailPoolRef = useRef<HTMLAudioElement[]>([]);
  const correctPoolRef = useRef<HTMLAudioElement[]>([]);
  const wrongPoolRef = useRef<HTMLAudioElement[]>([]);
  const yayPoolRef = useRef<HTMLAudioElement[]>([]);
  const mailPoolIdxRef = useRef(0);
  const correctPoolIdxRef = useRef(0);
  const wrongPoolIdxRef = useRef(0);
  const yayPoolIdxRef = useRef(0);
  const bgmStartedRef = useRef(false);
  const sfxPrimedRef = useRef(false);

  const titles: Record<Page, string> = {
    0: 'Untuk Nia :3',
    1: 'Halo Sayang :3',
    2: 'Surat kecil untukmu',
    3: 'Pap cowo nya niaaa :D',
    4: 'Kuis mini sayang :3',
    5: 'Bucket bunga virtual',
    6: 'Titik akhir yang manis'
  };

  const mainButtonLabel: Record<Page, string | null> = {
    0: 'mulai',
    1: 'next',
    2: null,
    3: null,
    4: null,
    5: null,
    6: null
  };

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    bgmRef.current = new Audio('/bgmusic.mp3');
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.35;
    bgmRef.current.preload = 'auto';
    bgmRef.current.load();

    popSfxRef.current = new Audio('/popbutton.mp3');
    popSfxRef.current.volume = 0.85;
    popSfxRef.current.preload = 'auto';
    popSfxRef.current.load();

    transitionSfxRef.current = new Audio('/transition.mp3');
    transitionSfxRef.current.volume = 0.7;
    transitionSfxRef.current.preload = 'auto';
    transitionSfxRef.current.load();

    const createPool = (src: string, volume: number, size = 5) =>
      Array.from({ length: size }, () => {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.preload = 'auto';
        audio.load();
        return audio;
      });

    mailPoolRef.current = createPool('/mail.mp3', 0.9);
    correctPoolRef.current = createPool('/correct.mp3', 0.9);
    wrongPoolRef.current = createPool('/wrong.mp3', 0.9);
    yayPoolRef.current = createPool('/yay.mp3', 0.9);

    return () => {
      [
        bgmRef.current,
        popSfxRef.current,
        transitionSfxRef.current,
        ...mailPoolRef.current,
        ...correctPoolRef.current,
        ...wrongPoolRef.current,
        ...yayPoolRef.current
      ].forEach((a) => {
        if (!a) return;
        a.pause();
        a.currentTime = 0;
      });
    };
  }, []);

  useEffect(() => {
    const warmup = () => {
      primeSfx();
      window.removeEventListener('pointerdown', warmup);
      window.removeEventListener('keydown', warmup);
    };
    window.addEventListener('pointerdown', warmup, { passive: true });
    window.addEventListener('keydown', warmup);
    return () => {
      window.removeEventListener('pointerdown', warmup);
      window.removeEventListener('keydown', warmup);
    };
  }, []);

  useEffect(() => {
    if (page !== 2) setEnvelopeOpen(false);
  }, [page]);

  useEffect(() => {
    if (page === 5) setBucketCardOpen(false);
  }, [page]);

  function goToQuizFromGallery() {
    playButtonSfx();
    setQuizStep(0);
    setQuizFeedback(null);
    setQuizShake(false);
    setQuizWrongTease(null);
    goToPage(4);
  }

  function tryPlay(audio: HTMLAudioElement | null, restart = true) {
    if (!audio) return;
    if (restart) audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }

  function playFromPool(poolRef: MutableRefObject<HTMLAudioElement[]>, indexRef: MutableRefObject<number>, startAt = 0) {
    const pool = poolRef.current;
    if (!pool.length) return;
    const i = indexRef.current % pool.length;
    indexRef.current += 1;
    const audio = pool[i];
    try {
      audio.pause();
      audio.currentTime = startAt;
      void audio.play().catch(() => undefined);
    } catch {
      // noop
    }
  }

  function ensureBgm() {
    if (bgmStartedRef.current) return;
    bgmStartedRef.current = true;
    tryPlay(bgmRef.current, false);
  }

  function primeSfx() {
    if (sfxPrimedRef.current) return;
    sfxPrimedRef.current = true;
    [
      popSfxRef.current,
      transitionSfxRef.current,
      ...mailPoolRef.current,
      ...correctPoolRef.current,
      ...wrongPoolRef.current,
      ...yayPoolRef.current
    ].forEach((audio) => {
      if (!audio) return;
      const prevMuted = audio.muted;
      audio.muted = true;
      audio.currentTime = 0;
      void audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = prevMuted;
      }).catch(() => {
        audio.muted = prevMuted;
      });
    });
  }

  function playButtonSfx() {
    ensureBgm();
    primeSfx();
    tryPlay(popSfxRef.current);
  }

  function goToPage(target: Page) {
    if (transitioning) return;
    ensureBgm();
    tryPlay(transitionSfxRef.current);
    setTransitioning(true);

    timersRef.current.push(
      window.setTimeout(() => {
        setPage(target);
      }, SWITCH_AT_MS)
    );

    timersRef.current.push(
      window.setTimeout(() => {
        setTransitioning(false);
      }, TRANSITION_MS)
    );
  }

  function handleMainButtonClick() {
    if (transitioning) return;
    playButtonSfx();
    if (page === 0) goToPage(1);
    else if (page === 1) goToPage(2);
  }

  function handleEnvelopeClick() {
    if (envelopeOpen) return;
    playButtonSfx();
    // Samakan dengan tombol: langsung bunyi di event klik.
    playFromPool(mailPoolRef, mailPoolIdxRef, 0.25);
    setEnvelopeOpen(true);
  }

  const showMainButton =
    page !== 2 &&
    page !== 3 &&
    page !== 4 &&
    page !== 5 &&
    page !== 6 &&
    mainButtonLabel[page] !== null;

  function handleQuizPick(choiceIndex: number) {
    if (quizFeedback !== null || quizStep >= QUIZ.length) return;
    const current = QUIZ[quizStep];
    if (choiceIndex === current.correct) {
      const isLastQuestion = quizStep === QUIZ.length - 1;
      if (isLastQuestion) {
        if (!bgmStartedRef.current) {
          bgmStartedRef.current = true;
          tryPlay(bgmRef.current, false);
        }
        playFromPool(yayPoolRef, yayPoolIdxRef, 0);
      } else {
        playFromPool(correctPoolRef, correctPoolIdxRef, 0.18);
      }
      setQuizFeedback('correct');
      timersRef.current.push(
        window.setTimeout(() => {
          setQuizFeedback(null);
          setQuizStep((s) => s + 1);
        }, 650)
      );
    } else {
      playFromPool(wrongPoolRef, wrongPoolIdxRef, 0.15);
      const line =
        QUIZ_WRONG_TEASES[Math.floor(Math.random() * QUIZ_WRONG_TEASES.length)];
      setQuizWrongTease(line);
      setQuizFeedback('wrong');
      setQuizShake(true);
      timersRef.current.push(
        window.setTimeout(() => {
          setQuizFeedback(null);
          setQuizShake(false);
          setQuizWrongTease(null);
        }, 3100)
      );
    }
  }

  const videoLayerClass =
    page === 2
      ? 'opacity-0 pointer-events-none'
      : transitioning
        ? 'opacity-90'
        : 'opacity-100';

  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto overflow-hidden flex flex-col items-center justify-center">
      <video
        src="/bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover pixel-bg--a transition-opacity duration-300 ${videoLayerClass}`}
      />

      {page === 2 && (
        <div className="retro-letter-scene absolute inset-0 z-[1]" aria-hidden>
          <img
            src="/bg2.gif"
            alt=""
            className="retro-letter-scene__bg"
            draggable={false}
          />
        </div>
      )}

      <div
        className={`absolute inset-0 stars-overlay transition-opacity duration-300 ${
          page === 2 ? 'opacity-0 pointer-events-none' : ''
        }`}
      />

      <div
        className={`cloud-transition ${transitioning ? 'cloud-transition--active' : ''}`}
        aria-hidden="true"
      />

      {page === 6 ? (
        <div className="relative z-10 w-full max-w-md px-5 pt-6 pb-8 min-h-[55dvh] flex flex-col items-center justify-center text-center gap-6">
          <div className="finale-page__glow rounded-2xl border-[4px] border-pink-300/90 bg-gradient-to-b from-[#fff7fb]/95 to-[#fce7f3]/90 px-5 py-8 max-w-sm w-full">
            <div className="flex justify-center mb-4">
              <PixelHeartSeal className="scale-110" />
            </div>
            <h2 className="text-[0.48rem] sm:text-[0.55rem] text-[#831843] pixel-font leading-relaxed mb-4 drop-shadow-sm">
              {titles[6]}
            </h2>
            <p className="pixel-font text-[0.34rem] sm:text-[0.38rem] leading-[1.85] text-[#5b2d4e]">
              Makasih yaa sayanggg udah mau scroll sampai akhir. Semoga halaman kecil ini bisa bikin kamu senyum — kalau
              kangen, buka lagi kapan aja ya sayang. Lopyuuuuu!
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playButtonSfx();
              goToPage(0);
            }}
            disabled={transitioning}
            className="w-full max-w-sm pixel-font text-[0.34rem] sm:text-[0.38rem] py-3.5 border-[3px] border-pink-400 bg-pink-500 text-white shadow-[4px_4px_0_#831843] hover:brightness-110 active:translate-y-[2px] active:shadow-[2px_2px_0_#831843] disabled:opacity-50"
          >
            mulai lagi dari awal
          </button>
        </div>
      ) : page === 5 ? (
        <div className="relative z-10 w-full max-w-md flex flex-col min-h-[50dvh] pb-28">
          <div className="px-4 pt-4 flex flex-col items-center gap-4 flex-1">
            <h2 className="text-base sm:text-lg text-white pixel-font text-center drop-shadow-md px-2">
              {titles[5]}
            </h2>
            <p className="text-[0.38rem] sm:text-[0.42rem] text-pink-100 pixel-font text-center opacity-90 px-2">
              Bucket + kartu ucapan khusus buat kamu
            </p>
            <div className="flower-bucket-scene flex flex-col items-center gap-4 w-full max-w-md">
              <div className="flower-bucket-scene__pot">
                <img
                  src="/bucket.png"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="flower-bucket-scene__img [image-rendering:pixelated] [image-rendering:crisp-edges]"
                />
              </div>
              <div className="w-full max-w-md">
                {bucketCardOpen ? (
                  <div className="pixel-greeting-card pixel-greeting-card--open pixel-font">
                    <p className="pixel-greeting-card__msg text-[0.42rem] sm:text-[0.48rem] leading-relaxed text-[#5b2d4e]">
                      {BUCKET_CARD_MESSAGE}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        playButtonSfx();
                        setBucketCardOpen(false);
                      }}
                      className="mt-4 w-full text-[0.36rem] sm:text-[0.4rem] py-3 border-[3px] border-pink-400 bg-white text-[#831843] shadow-[3px_3px_0_#db2777] active:translate-y-[2px] active:shadow-[1px_1px_0_#db2777]"
                    >
                      tutup kartu
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playButtonSfx();
                      setBucketCardOpen(true);
                    }}
                    className="pixel-greeting-card pixel-greeting-card--closed pixel-font w-full text-[0.4rem] sm:text-[0.44rem] py-8 px-5 text-[#831843] border-[4px] border-pink-500 bg-gradient-to-b from-[#fff7fb] to-[#fce7f3] shadow-[4px_4px_0_#be185d] hover:brightness-105 active:translate-y-[2px] active:shadow-[2px_2px_0_#be185d]"
                  >
                    ketuk untuk buka kartu ucapan
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 bg-gradient-to-t from-black/55 via-black/25 to-transparent z-[15]">
            <button
              type="button"
              onClick={() => {
                playButtonSfx();
                goToPage(6);
              }}
              disabled={transitioning}
              className="w-full pixel-font text-[0.38rem] sm:text-[0.42rem] py-3.5 border-[3px] border-pink-300 bg-pink-500 text-white shadow-[4px_4px_0_#9d174d] hover:brightness-110 active:translate-y-[2px] active:shadow-[2px_2px_0_#9d174d] disabled:opacity-50"
            >
              lanjut
            </button>
          </div>
        </div>
      ) : page === 4 ? (
        <div className="relative z-10 w-full max-w-md px-4 pb-28 pt-4 min-h-[50dvh] flex flex-col items-center">
          {quizStep < QUIZ.length ? (
            <>
              <h2 className="text-lg sm:text-xl text-white pixel-font text-center mb-2 drop-shadow-md px-2">
                {titles[4]}
              </h2>
              <p className="text-[0.45rem] sm:text-[0.5rem] text-pink-100 pixel-font text-center mb-6 opacity-90">
                {quizStep + 1} / {QUIZ.length}
              </p>
              <div
                className={`quiz-card quiz-card--pixel w-full max-w-sm ${quizShake ? 'quiz-card--shake' : ''} ${
                  quizFeedback === 'correct' ? 'quiz-card--correct' : ''
                } ${quizFeedback === 'wrong' ? 'quiz-card--wrong' : ''}`}
              >
                <p className="quiz-card__q pixel-font text-[0.52rem] sm:text-[0.58rem] leading-relaxed text-[#5b2d4e] text-center mb-6">
                  {QUIZ[quizStep].q}
                </p>
                {quizFeedback === 'wrong' && quizWrongTease ? (
                  <p
                    className="quiz-wrong-tease pixel-font text-[0.38rem] sm:text-[0.42rem] leading-relaxed text-center text-rose-700 mb-4 px-1 animate-pulse"
                    role="status"
                  >
                    {quizWrongTease}
                  </p>
                ) : null}
                <div className="flex flex-col gap-3">
                  {QUIZ[quizStep].options.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      disabled={quizFeedback !== null}
                      onClick={() => handleQuizPick(i)}
                      className="quiz-option quiz-option--pixel pixel-font text-[0.42rem] sm:text-[0.48rem] text-left px-4 py-3 border-[3px] border-pink-400 bg-white/95 text-[#831843] shadow-[3px_3px_0_#db2777] hover:bg-pink-50 disabled:opacity-60 disabled:pointer-events-none active:translate-y-[2px] active:shadow-[1px_1px_0_#db2777]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <QuizMascot
                mood={
                  quizFeedback === 'correct' ? 'happy' : quizFeedback === 'wrong' ? 'sad' : 'idle'
                }
              />
            </>
          ) : (
            <div className="quiz-finale w-full max-w-sm text-center relative">
              <div className="quiz-confetti" aria-hidden="true" />
              <h2 className="relative z-10 text-xl sm:text-2xl text-white pixel-font mb-4 drop-shadow-md">
                Yeay Nia!
              </h2>
              <p className="relative z-10 pixel-font text-[0.48rem] sm:text-[0.55rem] leading-relaxed text-white drop-shadow-[0_0_7px_rgba(0,0,0,0.9)] mb-8 px-2">
                Tiga pertanyaan, satu jawaban pasti: kamu yang paling aku sayang. Makasih udah main kuis kecil ini —
                Ciummmm mmmmmwahhhh
              </p>
              <div className="flex flex-col justify-center items-stretch">
                <button
                  type="button"
                  onClick={() => {
                    playButtonSfx();
                    goToPage(5);
                  }}
                  disabled={transitioning}
                  className="w-full pixel-font text-[0.42rem] px-5 py-4 border-[3px] border-pink-400 bg-pink-500 text-white shadow-[4px_4px_0_#831843] hover:brightness-110 active:translate-y-[2px] active:shadow-[2px_2px_0_#831843] disabled:opacity-50"
                >
                  {'lanjut — bucket & kartu'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : page === 3 ? (
        <div className="relative z-10 w-full max-w-md px-4 pb-28 pt-4 overflow-y-auto max-h-[100dvh]">
          <h2 className="text-xl sm:text-2xl text-white pixel-font text-center mb-6 drop-shadow-md">
            {titles[3]}
          </h2>
          <img
            src="/pap.gif"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="mx-auto mb-5 h-16 sm:h-20 md:h-24 w-auto [image-rendering:pixelated] [image-rendering:crisp-edges] drop-shadow-md"
          />
          <div className="gallery-kawaii" aria-label="Galeri foto">
            {GALLERY_PHOTOS.map((n, i) => (
              <figure key={n} className={`gallery-card gallery-card--${i + 1}`}>
                <div
                  className="gallery-card__pop"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="gallery-card__tape" aria-hidden="true" />
                  <div className="gallery-card__inner">
                    <img
                      src={`/image${n}.jpeg`}
                      alt={`Kenangan ${n}`}
                      className="gallery-card__img"
                      loading="lazy"
                    />
                  </div>
                  <figcaption className="gallery-card__caption pixel-font">
                    #{n}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-4 pt-3 bg-gradient-to-t from-black/50 to-transparent z-[15]">
            <button
              type="button"
              onClick={goToQuizFromGallery}
              disabled={transitioning}
              className="w-full pixel-font text-sm py-3 border-[3px] border-pink-300 bg-pink-500 text-white shadow-[4px_4px_0_#9d174d] hover:brightness-110 active:translate-y-[2px] active:shadow-[2px_2px_0_#9d174d] disabled:opacity-50"
            >
              lanjut kuis mini
            </button>
          </div>
        </div>
      ) : page === 2 ? (
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 w-full max-w-sm">
          <h2 className="retro-letter-title text-xl sm:text-2xl pixel-font text-center animate-bounce-slow max-w-[18ch] leading-relaxed">
            {titles[2]}
          </h2>

          <button
            type="button"
            onClick={handleEnvelopeClick}
            disabled={envelopeOpen}
            className="envelope-hit relative z-10 bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300 rounded-none"
            aria-label={envelopeOpen ? 'Amplop sudah terbuka' : 'Buka amplop'}
          >
            <div className={`envelope-shell envelope-shell--retro ${envelopeOpen ? '' : 'envelope-float'}`}>
              <div className={`envelope envelope--retro ${envelopeOpen ? 'envelope--open' : ''}`}>
                <div className="envelope__back" />
                <div className="envelope__paper">
                  <div className="envelope__sparkles" aria-hidden="true" />
                  <p className="envelope__paper-text pixel-font">
                    Untuk Nia — Sayang tau ngga? aku bener bener sayaaang banget sama kamu, lopyuu so much sayaang mmmwah
                  </p>
                </div>
                <div className="envelope__mask" aria-hidden="true" />
                <div className="envelope__pocket" />
                <div className="envelope__flap" />
                <div className="envelope__lock" aria-hidden="true">
                  <PixelHeartSeal className="envelope__pixel-heart" />
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playButtonSfx();
              goToPage(3);
            }}
            disabled={transitioning || !envelopeOpen}
            className="retro-letter-btn pixel-font text-sm sm:text-base text-[#5b2d4e] px-10 py-3 border-[3px] border-[#f472b6] bg-[#fef3c7] shadow-[4px_4px_0_#db2777] hover:brightness-105 active:translate-y-[2px] active:shadow-[2px_2px_0_#db2777] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:translate-y-0"
          >
            lanjut
          </button>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-8 px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl text-white pixel-font text-center animate-bounce-slow leading-tight">
            {titles[page]}
          </h1>

          {showMainButton && (
            <button
              type="button"
              onClick={handleMainButtonClick}
              disabled={transitioning}
              className="pixel-font text-xl bg-pink-400 hover:bg-pink-500 text-white px-12 py-4 rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 border-4 border-pink-600 disabled:opacity-60 disabled:hover:scale-100"
            >
              {mainButtonLabel[page]}
            </button>
          )}
        </div>
      )}

      {page !== 3 && page !== 4 && page !== 5 && page !== 6 && (
        <div className="absolute bottom-4 left-4 z-20 animate-bounce-gentle pointer-events-none">
          <img
            src={page === 2 ? '/hihi.gif' : '/download.gif'}
            alt={page === 2 ? 'Hihi' : 'Cinnamon'}
            className="w-32 h-32 object-contain [image-rendering:pixelated]"
          />
        </div>
      )}
    </div>
  );
}

export default App;
