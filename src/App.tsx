function App() {
  return (
    <div className="relative min-h-screen w-full max-w-md mx-auto overflow-hidden flex flex-col items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center animate-float"
        style={{
          backgroundImage: 'url(/download.jpg)',
          backgroundSize: 'cover'
        }}
      />

      <div className="absolute inset-0 stars-overlay" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        <h1 className="text-5xl md:text-6xl text-white pixel-font text-center animate-bounce-slow">
          Halo Sayang :3
        </h1>

        <button className="pixel-font text-xl bg-pink-400 hover:bg-pink-500 text-white px-12 py-4 rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 border-4 border-pink-600">
          mulai
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 animate-bounce-gentle">
        <img
          src="/download.gif"
          alt="Cinnamon"
          className="w-32 h-32 object-contain"
        />
      </div>
    </div>
  );
}

export default App;
