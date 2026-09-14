/** Generated from design-tokens.json — Professional Directory SaaS.
 *  Radius is intentionally 0 across the board and the type family is Archivo.
 *  Per-vertical and per-tenant accents come in at runtime via CSS variables
 *  (see specifications/color-customization.md), not through this config. */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ground:   { DEFAULT: '#F3F2F2', surface: '#EAE9E9' },
        ink:      { DEFAULT: '#201E1D', 100:'#F8F4F4',200:'#EAE7E7',300:'#D7D3D3',400:'#BAB6B6',
                    500:'#9B9797',600:'#7D7979',700:'#605D5D',800:'#444141',900:'#2D2B2B' },
        platform: { DEFAULT:'#EC3013',100:'#FFF2EF',200:'#FFE0D9',300:'#FFC4B8',400:'#FF9783',
                    500:'#FF563C',600:'#DD2B0F',700:'#AE1800',800:'#7C1405',900:'#4D170E' },
        lawyer:   { DEFAULT:'#0066CC', dark:'#004499', light:'#66B3FF' },
        ca:       { DEFAULT:'#2D7C4A', dark:'#1F4A2C', light:'#5ABA77' },
        tax:      { DEFAULT:'#E67E22', dark:'#D35400', light:'#F39C12' },
        brand:    'var(--brand)',        // active tenant colour
        brandInk: 'var(--brand-ink)',    // same hue, text-safe on the light ground
        success:'#27AE60', warning:'#F39C12', error:'#E74C3C', info:'#3498DB',
      },
      fontFamily: { sans: ['Archivo','system-ui','sans-serif'], mono: ['Monaco','Courier New','monospace'] },
      fontSize: {
        kicker:['10px',{lineHeight:'1',letterSpacing:'0.14em',fontWeight:'600'}],
        micro:['12px',{lineHeight:'1.4'}], small:['13px',{lineHeight:'1.5'}],
        body:['15px',{lineHeight:'1.65'}], h3:['16px',{lineHeight:'1.25',letterSpacing:'-0.01em'}],
        h2:['38px',{lineHeight:'1.05',letterSpacing:'-0.03em'}],
        h1:['56px',{lineHeight:'1',letterSpacing:'-0.035em'}],
        display:['78px',{lineHeight:'0.95',letterSpacing:'-0.045em'}],
      },
      spacing: { xs:'4px', sm:'8px', md:'16px', lg:'24px', xl:'32px', xxl:'48px' },
      borderRadius: { none:'0', sm:'0', DEFAULT:'0', md:'0', lg:'0', xl:'0', full:'0' },
      boxShadow: { sm:'0 1px 2px rgba(45,43,43,0.14)', md:'0 3px 10px rgba(45,43,43,0.16)', lg:'0 12px 32px rgba(45,43,43,0.22)' },
      borderWidth: { rule:'2px' },
      maxWidth: { container:'1200px', measure:'720px' },
      aspectRatio: { portrait:'4 / 5' },
      screens: { mobile:'375px', tablet:'768px', desktop:'1200px', wide:'1600px' },
    },
  },
  plugins: [],
};
