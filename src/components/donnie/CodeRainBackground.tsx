import { useEffect, useRef } from "react";

const CodeRainBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Code snippets to display
    const codeSnippets = [
      "const build = () =>",
      "function architect()",
      "import { Tool }",
      "export default",
      "async await",
      "return true;",
      "<Component />",
      "setState({})",
      "useEffect(() =>",
      "npm install",
      "git commit -m",
      "deploy --prod",
      "const AI =",
      "gemini.chat()",
      "lovable.build()",
      "0101001",
      "1100110",
      "{ success }",
      "=> Promise",
      "interface {}",
    ];

    const fontSize = 14;
    const columns = Math.floor(canvas.width / (fontSize * 8));
    const drops: number[] = Array(columns).fill(1);
    const snippets: string[] = Array(columns).fill("");
    const speeds: number[] = Array(columns).fill(0).map(() => 0.5 + Math.random() * 1.5);

    // Assign random snippets
    for (let i = 0; i < columns; i++) {
      snippets[i] = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
    }

    const draw = () => {
      // Semi-transparent black for trail effect
      ctx.fillStyle = "rgba(10, 10, 10, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'JetBrains Mono', 'Fira Code', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize * 8;
        const y = drops[i] * fontSize;

        // Gradient from bright to dim
        const alpha = Math.max(0.1, 1 - (drops[i] * fontSize) / canvas.height);
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha * 0.4})`;

        ctx.fillText(snippets[i], x, y);

        // Reset when off screen
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
          snippets[i] = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        }

        drops[i] += speeds[i];
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-30"
    />
  );
};

export default CodeRainBackground;
