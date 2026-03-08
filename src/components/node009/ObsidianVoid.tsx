import React from "react";

const ObsidianVoid = () => {
  return (
    <>
      <style>{`
        @keyframes deepBreath {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.02); }
        }
        .obsidian-void {
          position: fixed;
          inset: 0;
          background: #050505;
          animation: deepBreath 10s ease-in-out infinite;
        }
      `}</style>
      <div className="obsidian-void" />
    </>
  );
};

export default ObsidianVoid;
