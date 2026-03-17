// ─── Global CSS & Theme ──────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --font-d:'Playfair Display',Georgia,serif;
    --font-b:'DM Sans',system-ui,sans-serif;
    --rose:#C2185B; --rose2:#E91E8C; --saffron:#E65100; --gold:#F9A825;
    --teal:#00695C; --teal2:#26A69A; --purple:#6A1B9A; --purple2:#AB47BC;
    --dark:#1A0A00; --dark2:#2D1200; --text:#2D1A0E; --text2:#5C3D2E; --muted:#9E7B6B;
    --ivory:#FDF8F3; --ivory2:#F7F0E8; --ivory3:#F0E6D8; --cream:#FAF5EE;
    --border:#E8D5C4; --border2:#D4B89A;
    --roseL:#FCE4EC; --saffronL:#FFF3E0; --tealL:#E0F2F1; --purpleL:#F3E5F5;
    --white:#FFFFFF;
  }
  html{scroll-behavior:smooth}
  body{font-family:var(--font-b);background:var(--ivory);color:var(--text);-webkit-font-smoothing:antialiased}
  img{max-width:100%}
  button{font-family:var(--font-b);cursor:pointer}
  a{color:inherit}

  .rose-text{background:linear-gradient(135deg,var(--rose),var(--saffron));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .gold-text{background:linear-gradient(135deg,var(--gold),var(--saffron));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 28px;border-radius:14px;font-weight:700;font-size:14px;letter-spacing:.2px;border:none;transition:all .3s cubic-bezier(.25,.46,.45,.94);cursor:pointer;position:relative;overflow:hidden;font-family:var(--font-b)}
  .btn-rose{background:linear-gradient(135deg,var(--rose),var(--saffron));color:#fff;box-shadow:0 4px 20px rgba(194,24,91,0.3)}
  .btn-rose:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(194,24,91,0.45)}
  .btn-saffron{background:linear-gradient(135deg,var(--saffron),var(--gold));color:#fff;box-shadow:0 4px 20px rgba(230,81,0,0.3)}
  .btn-saffron:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(230,81,0,0.4)}
  .btn-outline{background:transparent;color:var(--rose);border:2px solid var(--rose)}
  .btn-outline:hover{background:var(--rose);color:#fff;transform:translateY(-2px)}
  .btn-ghost{background:rgba(255,255,255,0.9);color:var(--text);border:1.5px solid var(--border2)}
  .btn-ghost:hover{background:#fff;border-color:var(--rose);color:var(--rose);transform:translateY(-2px)}
  .btn-dark{background:var(--dark);color:#fff}
  .btn-dark:hover{background:var(--dark2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.3)}
  .card-base{background:var(--white);border-radius:20px;border:1.5px solid var(--border);transition:all .35s cubic-bezier(.25,.46,.45,.94)}
  .card-hover:hover{transform:translateY(-8px);box-shadow:0 20px 60px rgba(26,10,0,0.15);border-color:var(--rose)}
  .tag{display:inline-flex;align-items:center;gap:5px;padding:5px 13px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.3px}
  input:focus,select:focus,textarea:focus{outline:none!important;border-color:var(--rose)!important;box-shadow:0 0 0 3px rgba(194,24,91,0.12)!important}
`;
