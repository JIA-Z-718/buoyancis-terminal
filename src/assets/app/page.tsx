import React from 'react';

export default function BlackPalaceHome() {
  return (
    <div className="bg-palace-blue-900 text-palace-grey-300 min-h-screen font-sans selection:bg-palace-gold selection:text-palace-blue-950 relative overflow-hidden">
      {/* 全局背景纹理覆盖层：
         这里使用一张深蓝色皮革纹理图片平铺作为全局背景，复制 Buoyancis 标志的质感。
         你需要在 public/images/ 目录下放置这张图片。
      */}
      <div className="absolute inset-0 bg-[url('/images/deep_blue_leather.jpg')] bg-repeat opacity-20 z-0"></div>

      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 lg:px-12 border-b border-palace-blue-700 fixed w-full bg-palace-blue-900/95 backdrop-blur-md z-50">
        {/* 品牌名应用 Serif 字体、全大写、金字 */}
        <div className="text-2xl font-bold tracking-widest uppercase text-palace-gold font-serif">BLACKPALACE</div>
        <div className="hidden md:flex space-x-8 text-sm text-palace-grey-500 font-medium tracking-wide items-center font-sans">
          <a href="#approach" className="hover:text-palace-gold transition-colors duration-300">Our Approach</a>
          <a href="#services" className="hover:text-palace-gold transition-colors duration-300">Services</a>
          {/* Audit Link (金边金字) */}
          <a href="mailto:office@blackpalace.se" className="border border-palace-gold text-palace-gold px-5 py-2 hover:bg-palace-gold hover:text-palace-blue-950 transition-all duration-300 font-semibold font-sans">
            Get an Audit
          </a>
        </div>
      </nav>

      {/* Hero Section (Our Approach) */}
      <section id="approach" className="px-6 pt-56 pb-32 max-w-6xl mx-auto text-center flex flex-col items-center relative z-10">
        <p className="text-palace-grey-500 text-xs md:text-sm tracking-[0.3em] uppercase mb-6 font-semibold font-sans">
          Based in Stockholm. Built for Global Dominance.
        </p>
        {/* 主标题 Serif，带有拉丝金属金色渐变 */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight tracking-tight text-white font-serif">
          Transforming Websites into <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-palace-gold-400 via-palace-gold to-palace-gold-600">Impenetrable Assets.</span>
        </h1>
        <p className="text-lg md:text-xl text-palace-grey-300 max-w-3xl mb-16 leading-relaxed font-sans">
          We help premium Swedish brands escape the margin-crushing trap of third-party platforms. 
          By fusing behavioral economics, precise financial forecasting, and enterprise-grade architecture, 
          BlackPalace AB builds independent digital fortresses that protect your margins and drive direct revenue.
        </p>
        
        {/* Killer CTA Section (金框深底，深蓝色基础) */}
        <div className="bg-palace-blue-950 p-10 md:p-12 rounded-sm border-l-4 border-palace-gold max-w-4xl w-full shadow-2xl relative overflow-hidden group">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white relative z-10 font-serif">Stop Paying Ransom to Intermediaries.</h3>
          <p className="text-palace-grey-300 text-lg mb-8 max-w-2xl mx-auto relative z-10 font-sans">
            Book a Private Margin Audit. Let’s calculate exactly how much profit BlackPalace AB can repatriate to your Swedish AB this quarter.
          </p>
          {/* 主 CTA 按钮 (金底蓝字) */}
          <a href="mailto:office@blackpalace.se" className="inline-block bg-palace-gold text-palace-blue-950 font-bold text-lg py-4 px-10 hover:bg-palace-gold-400 transition-colors duration-300 relative z-10 font-sans">
            Secure Your Private Margin Audit
          </a>
        </div>
      </section>
      
      {/* 这里添加一个蓝色边框分隔 */}
      <div className="max-w-6xl mx-auto border-palace-blue-700 border-t relative z-10"></div>

      {/* Framework Section (Services) */}
      <section id="services" className="px-6 py-32 bg-palace-blue-800 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-bold mb-4 text-white font-serif">Explore Our Framework</h2>
            <p className="text-xl text-palace-grey-500 font-sans">Not just lines of code. A strategic digital fortress.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-16">
            <div className="group font-sans">
              {/* Item Titles Serif, Gold Bottom Border, Gold Hover text */}
              <h4 className="text-xl font-bold mb-6 border-b border-palace-blue-700 pb-4 group-hover:border-palace-gold-600 transition-colors duration-300 text-white group-hover:text-palace-gold font-serif">Reclaim Sovereignty</h4>
              <p className="text-palace-grey-300 leading-relaxed text-sm">Stop losing 15-30% in commissions. BlackPalace AB builds high-converting direct channels that let you own your customer data and control your narrative.</p>
            </div>
            <div className="group font-sans">
              <h4 className="text-xl font-bold mb-6 border-b border-palace-blue-700 pb-4 group-hover:border-palace-gold-600 transition-colors duration-300 text-white group-hover:text-palace-gold font-serif">Behavioral Architecture</h4>
              <p className="text-palace-grey-300 leading-relaxed text-sm">Our UI/UX design is rooted in behavioral economics, precisely guiding your high-ticket clients from discovery to confident decision-making.</p>
            </div>
            <div className="group font-sans">
              <h4 className="text-xl font-bold mb-6 border-b border-palace-blue-700 pb-4 group-hover:border-palace-gold-600 transition-colors duration-300 text-white group-hover:text-palace-gold font-serif">Enterprise-Grade ICT</h4>
              <p className="text-palace-grey-300 leading-relaxed text-sm">Built for speed, security, and absolute scalability. We utilize modern ICT standards to ensure your digital palace performs flawlessly under any market condition.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-20 border-t border-palace-blue-700 text-center bg-palace-blue-950 relative z-10">
        <h2 className="text-2xl font-bold mb-6 text-white font-serif">Ready to Reclaim Your Digital Sovereignty?</h2>
        <p className="text-palace-grey-500 mb-10 text-lg font-sans">Direct communication for highly ambitious business owners in Stockholm.</p>
        <a href="mailto:office@blackpalace.se" className="text-xl font-bold tracking-widest mb-4 text-palace-gold hover:text-palace-gold-400 transition-colors font-serif">office@blackpalace.se</a>
        <p className="text-palace-grey-500 text-sm mt-4 mb-16 uppercase tracking-widest font-sans">Stockholm, Sweden</p>
        <p className="text-xs text-palace-gold/70 tracking-wider font-sans">© 2026 BLACKPALACE AB. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}