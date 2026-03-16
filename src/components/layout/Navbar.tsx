import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-[#d4af37]/20 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-[#d4af37] font-bold text-xl tracking-tighter">
          BUOYANCIS
        </Link>
        <div className="flex gap-8 text-xs tracking-widest uppercase">
          <Link to="/" className="text-white/60 hover:text-[#d4af37] transition-colors">Market</Link>
          <Link to="/sovereign-node" className="text-[#d4af37] hover:text-white transition-colors font-bold">
            Sovereign Node
          </Link>
        </div>
      </div>
    </nav>
  );
};