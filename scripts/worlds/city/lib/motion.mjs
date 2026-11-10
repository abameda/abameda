// Shared motion vocabulary. Everything is transform/opacity/fill, slow and eased; the resting
// frame (reduced motion, screenshots) is always the finished composition.
import { beamKeyframes } from './buildings-a.mjs';

export const MOTION = `
.tw{animation:tw 5.5s ease-in-out infinite}@keyframes tw{50%{opacity:.12}}
.fl{animation:fl 14s steps(1) infinite}@keyframes fl{0%,100%{opacity:1}68%{opacity:.1}80%{opacity:1}}
.fon{animation:fon 17s steps(1) infinite}@keyframes fon{0%,100%{fill:#2b2052}58%{fill:#ffcf7a}79%{fill:#2b2052}}
.blink{animation:blink 2.6s ease-in-out infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:.18}}
.pulse{animation:pulse 3.2s ease-in-out infinite}@keyframes pulse{50%{opacity:.4}}
.beam{animation:beam 10s linear infinite}.b2{animation-delay:-5s}
${beamKeyframes('beam')}
.minute{animation:spin 60s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.needle{animation:needle 7s ease-in-out infinite}@keyframes needle{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(9deg)}}
.shim{animation:shim 6.5s cubic-bezier(.6,0,.3,1) infinite}@keyframes shim{0%{transform:translateX(-1.4px)}55%,100%{transform:translateX(4.4px)}}
.feed{animation:feed 5s cubic-bezier(.5,0,.2,1) infinite}@keyframes feed{0%{transform:translateY(-.7px)}65%,100%{transform:translateY(0)}}
.trolley{animation:trolley 13s ease-in-out infinite}
.sway{animation:sway 3.4s ease-in-out infinite}@keyframes sway{0%,100%{opacity:1}50%{opacity:.85}}
.drift{animation:drift 26s ease-in-out infinite alternate}@keyframes drift{from{transform:translate(-18px,-10px)}to{transform:translate(22px,12px)}}
.glint{animation:glint 4s ease-in-out infinite}@keyframes glint{0%,100%{opacity:.15}50%{opacity:.85}}
`;
