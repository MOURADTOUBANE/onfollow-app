/** Small, flat, on-palette confetti burst (used when an application reaches "Offer"). */
export function confetti(x: number, y: number) {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cs = ['#6D28D9', '#8B5CF6', '#3F9B6B', '#E0A83A', '#C0605F', '#4F7FB0'];
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('i');
    p.className = 'conf';
    const s = 6 + Math.random() * 6;
    const round = Math.random() > 0.5;
    p.style.cssText = `width:${s}px;height:${round ? s : s * 1.7}px;background:${cs[i % cs.length]};border-radius:${round ? '50%' : '2px'};left:${x}px;top:${y}px`;
    document.body.appendChild(p);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.5;
    const d = 70 + Math.random() * 130;
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
    p.animate(
      [
        { transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
        { transform: `translate(${dx - s / 2}px,${dy}px) rotate(${(Math.random() - 0.5) * 540}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx * 1.15}px,${dy + 90}px) rotate(${(Math.random() - 0.5) * 720}deg)`, opacity: 0 },
      ],
      { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' },
    ).onfinish = () => p.remove();
  }
}
export const burstFrom = (el: Element | null) => {
  if (!el) return;
  const r = el.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2);
};
