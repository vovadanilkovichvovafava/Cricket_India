import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ENV } from '../../../shared/config/env';

const TOTAL = 6;

const AFFILIATE_LINK = 'https://siteofficialred.com/Qhs6z2nP?external_id={external_id}&sub_id_1={sub_id_1}';
function getOfferLink() {
  const base = ENV.BOOKMAKER_LINK !== '#' ? ENV.BOOKMAKER_LINK : AFFILIATE_LINK;
  return base.replace('{external_id}', 'cricketbaazi_pro').replace(/\{sub_id_\d+\}/g, '');
}

const quizCSS = `
:root{--qbg:#EEF1F7;--qcard:#FFF;--qprimary:#1B3A5C;--qaccent:#E8A317;--qgreen:#1DAA61;--qblue:#2B7AE8;--qpurple:#6366F1;--qred:#EF4444;--qtext:#1E293B;--qtext2:#5A6B80;--qtext3:#94A3B8;--qborder:#E2E8F0;--gold-g:linear-gradient(135deg,#F7C948 0%,#E8A317 100%);--blue-g:linear-gradient(135deg,#2B7AE8 0%,#1B6DD9 100%);--green-g:linear-gradient(135deg,#1DAA61 0%,#16894E 100%);--purple-g:linear-gradient(135deg,#6366F1 0%,#4F46E5 100%);--dark-g:linear-gradient(160deg,#0F2744 0%,#1B3A5C 40%,#2B5A8C 100%);--orange-g:linear-gradient(135deg,#FF9933 0%,#FF8800 100%)}
@keyframes qfadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes qscaleIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
@keyframes qshimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes qpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes qblink{0%,100%{opacity:1}50%{opacity:.2}}

.q-wrap{font-family:-apple-system,sans-serif;background:var(--qbg);color:var(--qtext);-webkit-font-smoothing:antialiased;max-width:480px;margin:0 auto;height:100dvh;overflow:hidden;position:relative}
.q-pbar{position:absolute;top:0;left:0;right:0;height:3px;background:var(--qborder);z-index:200}.q-pfill{height:100%;border-radius:0 3px 3px 0;background:var(--orange-g);transition:width .55s cubic-bezier(.22,1,.36,1)}
.q-back{position:absolute;top:10px;left:10px;z-index:201;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.95);border:1px solid var(--qborder);display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(8px);transition:transform .15s}.q-back:active{transform:scale(.9)}.q-back svg{width:17px;height:17px;color:var(--qtext2)}
.q-spill{position:absolute;top:10px;right:10px;z-index:201;font-size:11px;font-weight:700;color:var(--qtext3);background:rgba(255,255,255,.95);border:1px solid var(--qborder);padding:4px 11px;border-radius:100px;backdrop-filter:blur(8px)}
.q-step{display:none;height:100dvh;flex-direction:column;overflow:hidden}.q-step.active{display:flex;animation:qfadeUp .35s ease}
.q-body{flex:1;display:flex;flex-direction:column;padding:50px 14px 8px;overflow-y:auto;gap:8px}
.q-foot{padding:10px 14px;padding-bottom:calc(10px + env(safe-area-inset-bottom,6px));background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-top:1px solid var(--qborder)}
.q-btn{width:100%;padding:14px;border:none;border-radius:13px;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .15s}.q-btn:active{transform:scale(.97)}.q-btn svg{width:18px;height:18px;flex-shrink:0}
.q-btn.blue{background:var(--blue-g);color:#fff;box-shadow:0 3px 14px rgba(43,122,232,.3)}.q-btn.green{background:var(--green-g);color:#fff;box-shadow:0 3px 14px rgba(29,170,97,.3)}.q-btn.gold{background:var(--orange-g);color:#fff;box-shadow:0 3px 16px rgba(255,153,51,.4);animation:qpulse 2s infinite}
.q-hint{text-align:center;font-size:10px;color:var(--qtext3);margin-top:5px}
.q-sico{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:qscaleIn .4s cubic-bezier(.34,1.56,.64,1) .07s both}.q-sico svg{width:22px;height:22px}.q-sico.blue{background:#DBEAFE}.q-sico.blue svg{color:var(--qblue)}.q-sico.gold{background:#FEF3C7}.q-sico.gold svg{color:var(--qaccent)}.q-sico.green{background:#D1FAE5}.q-sico.green svg{color:var(--qgreen)}.q-sico.purple{background:#EDE9FE}.q-sico.purple svg{color:var(--qpurple)}.q-sico.red{background:#FEE2E2}.q-sico.red svg{color:var(--qred)}.q-sico.orange{background:#FFF7ED}.q-sico.orange svg{color:#FF9933}
.q-stit{font-size:20px;font-weight:800;color:var(--qprimary);line-height:1.2;animation:qfadeUp .35s ease .12s both;white-space:pre-line}.q-stit em{font-style:normal;color:#FF9933}.q-ssub{font-size:13px;color:var(--qtext2);line-height:1.5;animation:qfadeUp .35s ease .18s both}
.q-pgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex-shrink:0}.q-pcol{border-radius:13px;padding:13px 12px;animation:qfadeUp .35s ease both}.q-pcol.free{background:var(--qcard);border:1px solid var(--qborder)}.q-pcol.pro{background:var(--dark-g);border:2px solid #FF9933;position:relative;overflow:hidden}.q-pcol.pro::after{content:'PRO';position:absolute;top:0;right:0;background:var(--orange-g);color:#fff;font-size:8px;font-weight:900;letter-spacing:1px;padding:3px 9px;border-radius:0 11px 0 8px}
.q-plbl2{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}.q-pcol.free .q-plbl2{color:var(--qtext3)}.q-pcol.pro .q-plbl2{color:#FF9933}
.q-pi{font-size:11px;padding:5px 0;border-bottom:1px solid var(--qborder);display:flex;align-items:center;gap:6px}.q-pcol.pro .q-pi{border-bottom-color:rgba(255,255,255,.08);color:rgba(255,255,255,.85)}.q-pi:last-child{border-bottom:none}.q-px{color:var(--qred);font-weight:800;font-size:12px}.q-pc{color:var(--qgreen);font-weight:800;font-size:12px}
.q-ibox{border-radius:12px;padding:11px 13px;font-size:12px;line-height:1.6;color:var(--qtext2);animation:qfadeUp .35s ease both;flex-shrink:0}.q-ibox strong{color:var(--qtext)}.q-ibox.gold{background:#FFF7ED;border:1px solid rgba(255,153,51,.32)}.q-ibox.green{background:#F0FDF4;border:1px solid rgba(29,170,97,.28)}.q-ibox.blue{background:#EFF6FF;border:1px solid rgba(43,122,232,.22)}
.q-fcard{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);padding:11px 12px;animation:qfadeUp .35s ease both;display:flex;align-items:center;gap:11px;position:relative;overflow:hidden;flex-shrink:0}.q-fcard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px}.q-fcard.blue::before{background:var(--blue-g)}.q-fcard.gold::before{background:var(--orange-g)}.q-fcard.green::before{background:var(--green-g)}.q-fcard.purple::before{background:var(--purple-g)}
.q-fico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.q-fico svg{width:17px;height:17px}.q-fico.blue{background:#DBEAFE}.q-fico.blue svg{color:var(--qblue)}.q-fico.gold{background:#FFF7ED}.q-fico.gold svg{color:#FF9933}.q-fico.green{background:#D1FAE5}.q-fico.green svg{color:var(--qgreen)}.q-fico.purple{background:#EDE9FE}.q-fico.purple svg{color:var(--qpurple)}
.q-ftit{font-size:13px;font-weight:800;color:var(--qtext);margin-bottom:2px}.q-fdsc{font-size:11px;color:var(--qtext2);line-height:1.4}
.q-formula{background:#FFF7ED;border-radius:13px;border:1px solid rgba(255,153,51,.22);padding:12px 14px;animation:qfadeUp .35s ease .5s both;flex-shrink:0}.q-ftag{display:inline-block;background:var(--orange-g);color:#fff;font-size:9px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:2px 10px;border-radius:100px;margin-bottom:8px}.q-flines{font-size:13px;font-weight:700;color:var(--qtext);line-height:1.7;text-align:center}.q-fres{color:var(--qgreen);font-weight:800}
.q-unlock{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);overflow:hidden;flex-shrink:0;animation:qfadeUp .35s ease .5s both}.q-up-head{padding:8px 13px;background:#F8FAFC;border-bottom:1px solid var(--qborder);font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.6px;display:flex;align-items:center;justify-content:space-between}.q-up-tag{background:var(--orange-g);color:#fff;font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px}.q-up-row{display:flex;align-items:center;justify-content:space-between;padding:8px 13px;border-bottom:1px solid var(--qborder)}.q-up-row:last-child{border-bottom:none}.q-up-name{font-size:12px;font-weight:600;color:var(--qtext)}.q-up-ok{font-size:11px;font-weight:700;color:var(--qgreen);display:flex;align-items:center;gap:4px}.q-up-ok svg{width:11px;height:11px}
.q-dgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex-shrink:0}
.q-dopt{border-radius:12px;padding:13px 10px;cursor:pointer;transition:all .2s;background:var(--qcard);border:2px solid var(--qborder);position:relative;text-align:center;animation:qfadeUp .35s ease both}.q-dopt:active{transform:scale(.97)}.q-dopt.sel{border-color:#FF9933;background:#FFF7ED}.q-dopt.rec{border-color:var(--qgreen);background:#F0FDF4}.q-dopt .rtag{position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:var(--green-g);color:#fff;font-size:9px;font-weight:800;padding:2px 9px;border-radius:100px;white-space:nowrap}.q-dopt .rtag.blue{background:var(--orange-g)}.q-dopt .da{font-size:22px;font-weight:900;color:var(--qprimary)}.q-dopt .dl{font-size:10px;color:var(--qtext3);font-weight:600;margin-top:1px}.q-dopt .dbonus{font-size:10px;font-weight:800;color:#FF9933;margin-top:5px;background:#FFF7ED;border-radius:6px;padding:2px 6px;display:inline-block}.q-dopt .dbonus-green{color:var(--qgreen);background:#D1FAE5}
.q-slist{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);overflow:hidden;flex-shrink:0}.q-slrow{display:flex;align-items:center;gap:10px;padding:10px 13px;border-bottom:1px solid var(--qborder);animation:qfadeUp .35s ease both}.q-slrow:last-child{border-bottom:none}.q-slico{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.q-slico svg{width:15px;height:15px}.q-slico.blue{background:#DBEAFE}.q-slico.blue svg{color:var(--qblue)}.q-slico.green{background:#D1FAE5}.q-slico.green svg{color:var(--qgreen)}.q-slico.gold{background:#FFF7ED}.q-slico.gold svg{color:#FF9933}
.q-slrow h4{font-size:12px;font-weight:700;color:var(--qtext)}.q-slrow p{font-size:11px;color:var(--qtext2);margin-top:1px}
.q-sbadge{display:inline-flex;align-items:center;gap:7px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:9px;padding:7px 14px;font-size:12px;font-weight:700;color:var(--qgreen)}.q-sdot{width:6px;height:6px;border-radius:50%;background:var(--qgreen);animation:qblink 1.4s infinite}
.q-ai-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;flex-shrink:0;animation:qfadeUp .35s ease .62s both}.q-abox{background:var(--qcard);border:1px solid var(--qborder);border-radius:12px;padding:10px 8px;text-align:center}.q-abox .av{font-size:17px;font-weight:900;display:block}.q-abox .al{font-size:9px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.4px;margin-top:2px;display:block}.q-abox.g .av{color:var(--qgreen)}.q-abox.b .av{color:var(--qblue)}.q-abox.a .av{color:#FF9933}
.q-bonus-header{background:linear-gradient(135deg,#0F2744 0%,#1B3A5C 100%);border-radius:14px;padding:16px;text-align:center;flex-shrink:0;position:relative;overflow:hidden;animation:qfadeUp .35s ease both}
.q-bonus-header::before{content:'';position:absolute;top:-40px;right:-40px;width:130px;height:130px;border-radius:50%;background:rgba(255,153,51,.12)}
.q-bh-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(255,153,51,.18);border:1px solid rgba(255,153,51,.35);border-radius:100px;padding:4px 12px;font-size:10px;font-weight:800;color:#FF9933;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
.q-bh-dot{width:5px;height:5px;border-radius:50%;background:#FF9933;animation:qblink 1.2s infinite}
.q-bh-title{font-size:18px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:4px}
.q-bh-sub{font-size:12px;color:rgba(255,255,255,.55);line-height:1.4}
.q-calc-wrap{background:#fff;border:1px solid var(--qborder);border-radius:14px;overflow:hidden;flex-shrink:0;animation:qfadeUp .35s ease .15s both;margin-top:4px}
.q-calc-opts{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid var(--qborder);padding-top:18px;position:relative}
.q-copt{padding:10px 4px;text-align:center;cursor:pointer;transition:all .18s;border-right:1px solid var(--qborder);position:relative}.q-copt:last-child{border-right:none}.q-copt.active{background:#FFF7ED}
.q-copt .co-dep{font-size:13px;font-weight:900;color:var(--qprimary)}.q-copt.active .co-dep{color:#FF9933}
.q-copt .co-lbl{font-size:9px;color:var(--qtext3);font-weight:600;margin-top:1px}
.q-copt .co-rec{position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:var(--green-g);color:#fff;font-size:8px;font-weight:800;padding:2px 7px;border-radius:100px;white-space:nowrap}
.q-copt .co-min{position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:var(--orange-g);color:#fff;font-size:8px;font-weight:800;padding:2px 7px;border-radius:100px;white-space:nowrap}
.q-calc-result{padding:14px 16px}
.q-cr-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.q-cr-label{font-size:11px;color:var(--qtext3);font-weight:600}
.q-cr-val{font-size:13px;font-weight:800;color:var(--qtext)}
.q-cr-bonus{display:flex;align-items:center;gap:8px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:10px 12px;margin-bottom:10px}
.q-cr-bonus-ico{font-size:22px;flex-shrink:0}
.q-cr-bonus-body{flex:1}
.q-cr-bonus-title{font-size:13px;font-weight:800;color:var(--qgreen)}
.q-cr-bonus-sub{font-size:11px;color:var(--qtext2);margin-top:1px}
.q-cr-total{background:var(--dark-g);border-radius:11px;padding:12px;text-align:center}
.q-cr-total-lbl{font-size:10px;color:rgba(255,255,255,.5);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}
.q-cr-total-num{font-size:32px;font-weight:900;background:var(--orange-g);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:qshimmer 3s linear infinite;line-height:1}
.q-cr-total-sub{font-size:11px;color:rgba(255,255,255,.45);margin-top:3px}
.q-money-card{background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:13px;padding:13px;flex-shrink:0;animation:qfadeUp .35s ease .35s both}
.q-mc-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.q-mc-ico{width:32px;height:32px;border-radius:9px;background:var(--green-g);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.q-mc-ico svg{width:16px;height:16px;color:#fff}
.q-mc-title{font-size:13px;font-weight:800;color:#15803D}
.q-mc-rows{display:flex;flex-direction:column;gap:7px}
.q-mc-row{display:flex;align-items:flex-start;gap:8px;font-size:11px;color:#166534;line-height:1.45}
.q-mc-dot{width:5px;height:5px;border-radius:50%;background:#22C55E;flex-shrink:0;margin-top:4px}
.q-once-box{background:#FFF5F5;border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:11px 13px;display:flex;align-items:center;gap:10px;flex-shrink:0;animation:qfadeUp .35s ease .3s both}
.q-once-ico{font-size:20px;flex-shrink:0}
.q-once-text{font-size:12px;color:#B91C1C;line-height:1.5;font-weight:600}
.q-once-text strong{color:#991B1B}
.q-math-banner{background:var(--dark-g);border-radius:13px;padding:13px 14px;flex-shrink:0;animation:qfadeUp .35s ease .1s both;position:relative;overflow:hidden}
.q-math-banner::before{content:'';position:absolute;top:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,153,51,.1)}
.q-mb-label{font-size:9px;font-weight:800;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px}
.q-mb-row{display:flex;align-items:center;gap:0}
.q-mb-cell{flex:1;text-align:center;padding:8px 4px;border-radius:8px}
.q-mb-cell.green{background:rgba(74,222,128,.13);border:1px solid rgba(74,222,128,.2)}
.q-mb-cell.gold{background:rgba(255,153,51,.13);border:1px solid rgba(255,153,51,.2)}
.q-mb-cell.blue{background:rgba(147,197,253,.13);border:1px solid rgba(147,197,253,.2)}
.q-mb-val{font-size:18px;font-weight:900;line-height:1}
.q-mb-cell.green .q-mb-val{color:#4ADE80}
.q-mb-cell.gold .q-mb-val{color:#FF9933}
.q-mb-cell.blue .q-mb-val{color:#93C5FD}
.q-mb-sub{font-size:8px;color:rgba(255,255,255,.35);font-weight:600;margin-top:2px;line-height:1.3}
.q-mb-op{color:rgba(255,255,255,.2);font-size:18px;font-weight:300;padding:0 4px;flex-shrink:0;align-self:center}
.q-mb-note{font-size:10px;color:rgba(255,255,255,.4);margin-top:8px;line-height:1.5}
.q-min-alert{background:#FFF7ED;border:1.5px solid #FED7AA;border-radius:12px;padding:11px 13px;display:flex;align-items:flex-start;gap:10px;flex-shrink:0;animation:qfadeUp .35s ease both}
.q-min-alert-ico{font-size:18px;flex-shrink:0;margin-top:1px}
.q-min-alert-body{flex:1}
.q-min-alert-title{font-size:12px;font-weight:800;color:#C2410C;margin-bottom:2px}
.q-min-alert-text{font-size:11px;color:#9A3412;line-height:1.5}
.q-pay-row{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);padding:11px 13px;flex-shrink:0;animation:qfadeUp .35s ease .6s both}.q-pay-title{font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:9px;display:flex;align-items:center;gap:6px}.q-pay-chips{display:flex;gap:7px;flex-wrap:wrap}.q-pchip{background:#F8FAFC;border:1px solid var(--qborder);border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;color:var(--qtext2);display:flex;align-items:center;gap:5px}
.q-step.final .q-body{padding:0;justify-content:space-between}
.q-fhd{background:var(--dark-g);padding:38px 20px 24px;text-align:center;position:relative;overflow:hidden;flex-shrink:0}.q-fhd::before{content:'';position:absolute;top:-50px;right:-30px;width:150px;height:150px;border-radius:50%;background:rgba(255,153,51,.08)}
.q-ficobig{width:56px;height:56px;border-radius:18px;background:var(--orange-g);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 6px 22px rgba(255,153,51,.36);position:relative;z-index:1;animation:qscaleIn .45s cubic-bezier(.34,1.56,.64,1) both}.q-ficobig svg{width:26px;height:26px;color:#fff}.q-fhd .ft{font-size:22px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:5px;position:relative;z-index:1}.q-fhd .fs{font-size:13px;color:rgba(255,255,255,.6);position:relative;z-index:1}
.q-bfloat{margin:-18px 14px 0;position:relative;z-index:2;background:var(--qcard);border-radius:16px;padding:15px;text-align:center;box-shadow:0 10px 34px rgba(0,0,0,.11);border:1px solid var(--qborder);animation:qfadeUp .45s ease .2s both;flex-shrink:0}.q-bfl{font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.7px}.q-bfa{font-size:40px;font-weight:900;line-height:1.1;background:var(--orange-g);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:qshimmer 3s linear infinite;margin:3px 0}.q-bfd{font-size:12px;color:var(--qtext2)}
.q-mflow{display:flex;align-items:center;justify-content:center;gap:5px;padding:12px 14px 4px;animation:qfadeUp .35s ease .32s both;flex-shrink:0}.q-mstep{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}.q-mnum{width:28px;height:28px;border-radius:50%;background:var(--blue-g);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}.q-mnum.done{background:var(--green-g)}.q-mnum.done svg{width:13px;height:13px;color:#fff}.q-mlbl{font-size:9px;color:var(--qtext2);text-align:center;font-weight:600;line-height:1.3}.q-marr{color:var(--qtext3);font-size:14px;margin-top:-12px;flex-shrink:0}
.q-fgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:8px 14px 0;animation:qfadeUp .35s ease .38s both;flex-shrink:0}.q-fchip{background:var(--qcard);border:1px solid var(--qborder);border-radius:9px;padding:7px 10px;font-size:11px;font-weight:600;color:var(--qtext2);display:flex;align-items:center;gap:6px}.q-fchip svg{width:11px;height:11px;color:var(--qgreen);flex-shrink:0}
.q-trow{display:flex;justify-content:center;gap:7px;padding:8px 14px 0;flex-wrap:wrap;animation:qfadeUp .35s ease .44s both;flex-shrink:0}.q-tchip{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:var(--qtext3);background:var(--qcard);border:1px solid var(--qborder);border-radius:100px;padding:4px 10px}.q-tchip svg{width:10px;height:10px}
.q-review{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);padding:12px 13px;flex-shrink:0;animation:qfadeUp .35s ease .52s both;display:flex;align-items:flex-start;gap:10px;margin:0 14px}.q-rav{width:32px;height:32px;border-radius:50%;background:var(--dark-g);color:rgba(255,255,255,.9);font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}.q-rtext{font-size:12px;color:var(--qtext2);line-height:1.5}.q-rname{font-size:11px;font-weight:700;color:var(--qtext3);margin-top:4px;display:flex;align-items:center;gap:5px}.q-rstar{color:#FF9933;font-size:10px;letter-spacing:1px}
.q-bankroll{margin:0 14px;background:var(--qcard);border:1px solid var(--qborder);border-radius:13px;overflow:hidden;flex-shrink:0;animation:qfadeUp .35s ease .28s both}
.q-br-head{background:#F8FAFC;border-bottom:1px solid var(--qborder);padding:8px 13px;font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.6px}
.q-br-row{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;border-bottom:1px solid var(--qborder)}.q-br-row:last-child{border-bottom:none}
.q-br-label{font-size:12px;color:var(--qtext2);display:flex;align-items:center;gap:6px}.q-br-label span{width:7px;height:7px;border-radius:50%;flex-shrink:0}.q-br-label span.g{background:var(--qgreen)}.q-br-label span.a{background:#FF9933}.q-br-label span.b{background:var(--qblue)}
.q-br-val{font-size:13px;font-weight:800}.q-br-val.g{color:var(--qgreen)}.q-br-val.a{color:#FF9933}.q-br-val.b{color:var(--qblue)}
.q-br-total{background:var(--dark-g);display:flex;align-items:center;justify-content:space-between;padding:11px 13px}
.q-br-total-label{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.5px}
.q-br-total-val{font-size:20px;font-weight:900;background:var(--orange-g);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:qshimmer 3s linear infinite}
`;

const ArrowRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const CheckBold = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const Download = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const Card = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const CricketBall = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 4c1 3 1 6 0 8s-1 6 0 8"/><path d="M16 4c-1 3-1 6 0 8s1 6 0 8"/></svg>;

// Render HTML from translation (for <strong>, <em>, <span>)
function H({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

const calcTiers = [
  { dep: '\u20b91,000',  bonus: '\u20b91,500',  total: '\u20b92,500',  months: 1 },
  { dep: '\u20b92,000',  bonus: '\u20b93,000',  total: '\u20b95,000',  months: 2 },
  { dep: '\u20b95,000',  bonus: '\u20b97,500',  total: '\u20b912,500', months: 5 },
  { dep: '\u20b910,000', bonus: '\u20b915,000', total: '\u20b925,000', months: 8 },
];

export default function ProAccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState(0);
  const [calcSel, setCalcSel] = useState(0);
  const bookmakerLink = getOfferLink();

  const featureKeys = ['unlimitedAi', 'valueBetFinder', 'kellyCalc', 'advancedAnalytics'];
  const calcLabels = t('proAccess.step4.calcLabels', { returnObjects: true });

  const next = () => { if (step < TOTAL) setStep(step + 1); };
  const prev = () => { if (step > 1) setStep(step - 1); else navigate(-1); };

  return (
    <div className="q-wrap">
      <style>{quizCSS}</style>
      <div className="q-pbar"><div className="q-pfill" style={{ width: `${(step / TOTAL) * 100}%` }} /></div>
      <div className="q-back" onClick={prev}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </div>
      <div className="q-spill">{step} / {TOTAL}</div>

      {/* STEP 1 — Free vs PRO */}
      <div className={`q-step${step === 1 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-sico red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <div className="q-stit"><H html={t('proAccess.step1.title')} /></div>
          <div className="q-ssub">{t('proAccess.step1.subtitle')}</div>
          <div className="q-pgrid">
            <div className="q-pcol free">
              <div className="q-plbl2">{t('proAccess.step1.free')}</div>
              <div className="q-pi">{t('proAccess.step1.freePredictions')}</div>
              <div className="q-pi"><span className="q-px">&#10005;</span> {t('proAccess.features.valueBetFinder')}</div>
              <div className="q-pi"><span className="q-px">&#10005;</span> {t('proAccess.features.advancedAnalytics')}</div>
              <div className="q-pi"><span className="q-px">&#10005;</span> Bankroll Tracker</div>
              <div className="q-pi"><span className="q-px">&#10005;</span> {t('proAccess.features.kellyCalc')}</div>
            </div>
            <div className="q-pcol pro">
              <div className="q-plbl2">{t('proAccess.step1.pro')}</div>
              <div className="q-pi"><span className="q-pc">&#8734;</span> {t('proAccess.step1.unlimitedPredictions')}</div>
              <div className="q-pi"><span className="q-pc">&#10003;</span> {t('proAccess.features.valueBetFinder')}</div>
              <div className="q-pi"><span className="q-pc">&#10003;</span> {t('proAccess.features.advancedAnalytics')}</div>
              <div className="q-pi"><span className="q-pc">&#10003;</span> Bankroll Tracker</div>
              <div className="q-pi"><span className="q-pc">&#10003;</span> {t('proAccess.features.kellyCalc')}</div>
            </div>
          </div>
          <div className="q-ibox gold"><H html={t('proAccess.step1.iplStarted')} /></div>
          <div className="q-unlock">
            <div className="q-up-head">{t('proAccess.step1.unlockToday')}<div className="q-up-tag">PRO</div></div>
            {featureKeys.map((key, i) => (
              <div className="q-up-row" key={i}>
                <div className="q-up-name">{t(`proAccess.features.${key}`)}</div>
                <div className="q-up-ok"><Check />{t('proAccess.step1.unlocked')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="q-foot"><button className="q-btn blue" onClick={next}>{t('proAccess.step1.btn')}<ArrowRight /></button></div>
      </div>

      {/* STEP 2 — Not a payment */}
      <div className={`q-step${step === 2 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-sico green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div className="q-stit"><H html={t('proAccess.step2.title')} /></div>
          <div className="q-ssub">{t('proAccess.step2.subtitle')}</div>
          <div className="q-fcard green">
            <div className="q-fico green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
            <div><div className="q-ftit">{t('proAccess.step2.bankrollTitle')}</div><div className="q-fdsc">{t('proAccess.step2.bankrollDesc')}</div></div>
          </div>
          <div className="q-fcard gold">
            <div className="q-fico gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg></div>
            <div><div className="q-ftit">{t('proAccess.step2.bonusTitle')}</div><div className="q-fdsc">{t('proAccess.step2.bonusDesc')}</div></div>
          </div>
          <div className="q-fcard blue">
            <div className="q-fico blue"><CricketBall /></div>
            <div><div className="q-ftit">{t('proAccess.step2.proTitle')}</div><div className="q-fdsc">{t('proAccess.step2.proDesc')}</div></div>
          </div>
          <div className="q-formula">
            <div className="q-ftag">{t('proAccess.step2.howItWorks')}</div>
            <div className="q-flines">
              {t('proAccess.step2.formula1')}<br />
              {t('proAccess.step2.formula2')}<br />
              <span className="q-fres">{t('proAccess.step2.formula3')}</span>
            </div>
          </div>
        </div>
        <div className="q-foot"><button className="q-btn blue" onClick={next}>{t('proAccess.step2.btn')}<ArrowRight /></button></div>
      </div>

      {/* STEP 3 — Why this bookmaker */}
      <div className={`q-step${step === 3 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-sico orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div className="q-stit">{t('proAccess.step3.title')}</div>
          <div className="q-fcard green"><div className="q-fico green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><div><div className="q-ftit">{t('proAccess.step3.bestOdds')}</div><div className="q-fdsc">{t('proAccess.step3.bestOddsDesc')}</div></div></div>
          <div className="q-fcard blue"><div className="q-fico blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div><div><div className="q-ftit">{t('proAccess.step3.liveBetting')}</div><div className="q-fdsc">{t('proAccess.step3.liveBettingDesc')}</div></div></div>
          <div className="q-fcard gold"><div className="q-fico gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div><div className="q-ftit">{t('proAccess.step3.fastWithdraw')}</div><div className="q-fdsc">{t('proAccess.step3.fastWithdrawDesc')}</div></div></div>
          <div className="q-fcard purple"><div className="q-fico purple"><CricketBall /></div><div><div className="q-ftit">{t('proAccess.step3.allCricket')}</div><div className="q-fdsc">{t('proAccess.step3.allCricketDesc')}</div></div></div>
          <div className="q-ibox gold"><H html={t('proAccess.step3.trusted')} /></div>
          <div className="q-ai-stats">
            <div className="q-abox g"><span className="av">87%</span><span className="al">{t('proAccess.step3.aiAccuracy')}</span></div>
            <div className="q-abox b"><span className="av">50+</span><span className="al">{t('proAccess.step3.cricketLeagues')}</span></div>
            <div className="q-abox a"><span className="av">15 min</span><span className="al">{t('proAccess.step3.withdrawal')}</span></div>
          </div>
        </div>
        <div className="q-foot"><button className="q-btn blue" onClick={next}>{t('proAccess.step3.btn')}<ArrowRight /></button></div>
      </div>

      {/* STEP 4 — Bonus Calculator */}
      <div className={`q-step${step === 4 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-bonus-header">
            <div className="q-bh-tag"><div className="q-bh-dot" />{t('proAccess.step4.limitedOffer')}</div>
            <div className="q-bh-title"><H html={t('proAccess.step4.headerTitle')} /></div>
            <div className="q-bh-sub">{t('proAccess.step4.headerSub1')}<br/>{t('proAccess.step4.headerSub2')}</div>
          </div>

          <div className="q-calc-wrap">
            <div className="q-calc-opts">
              {calcTiers.map((tier, i) => (
                <div key={i} className={`q-copt${calcSel === i ? ' active' : ''}`} onClick={() => setCalcSel(i)}>
                  {i === 0 && <div className="co-min">{t('proAccess.step4.minPro')}</div>}
                  {i === 2 && <div className="co-rec">{t('proAccess.step4.bestValue')}</div>}
                  <div className="co-dep">{tier.dep}</div>
                  <div className="co-lbl">{Array.isArray(calcLabels) ? calcLabels[i] : ['Start', 'Popular', 'Best Value', 'Maximum'][i]}</div>
                </div>
              ))}
            </div>
            <div className="q-calc-result">
              {calcTiers.map((tier, i) => calcSel === i && (
                <div key={i}>
                  <div className="q-cr-row">
                    <div className="q-cr-label">{t('proAccess.step4.yourDeposit')}</div>
                    <div className="q-cr-val">{tier.dep}</div>
                  </div>
                  <div className="q-cr-bonus">
                    <div className="q-cr-bonus-ico">🎁</div>
                    <div className="q-cr-bonus-body">
                      <div className="q-cr-bonus-title">{tier.bonus} {t('proAccess.step4.freeBetBonus')}</div>
                      <div className="q-cr-bonus-sub">{t('proAccess.step4.creditedAuto')}</div>
                    </div>
                  </div>
                  <div className="q-cr-total">
                    <div className="q-cr-total-lbl">{t('proAccess.step4.totalToBet')}</div>
                    <div className="q-cr-total-num">{tier.total}</div>
                    <div className="q-cr-total-sub">{t('proAccess.step4.depositPlusBonus')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="q-money-card">
            <div className="q-mc-head">
              <div className="q-mc-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="q-mc-title">{t('proAccess.step4.moneyStaysTitle')}</div>
            </div>
            <div className="q-mc-rows">
              <div className="q-mc-row"><div className="q-mc-dot"/><span><H html={t('proAccess.step4.moneyStays1')} /></span></div>
              <div className="q-mc-row"><div className="q-mc-dot"/><span>{t('proAccess.step4.moneyStays2')}</span></div>
              <div className="q-mc-row"><div className="q-mc-dot"/><span>{t('proAccess.step4.moneyStays3')}</span></div>
            </div>
          </div>

          <div className="q-once-box">
            <div className="q-once-ico">&#9888;&#65039;</div>
            <div className="q-once-text">
              <H html={t('proAccess.step4.minDepositWarn')} />
            </div>
          </div>
        </div>
        <div className="q-foot">
          <button className="q-btn gold" onClick={next}>{t('proAccess.step4.btn')} <ArrowRight /></button>
          <div className="q-hint">{t('proAccess.step4.hint')}</div>
        </div>
      </div>

      {/* STEP 5 — Choose deposit amount */}
      <div className={`q-step${step === 5 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-sico blue"><Card /></div>
          <div className="q-stit"><H html={t('proAccess.step5.title')} /></div>
          <div className="q-ssub">{t('proAccess.step5.subtitle')}</div>

          <div className="q-math-banner">
            <div className="q-mb-label">{t('proAccess.step5.mathLabel')}</div>
            <div className="q-mb-row">
              <div className="q-mb-cell green">
                <div className="q-mb-val">{'\u20b9'}1K</div>
                <div className="q-mb-sub" style={{whiteSpace:'pre-line'}}>{t('proAccess.step5.yourMoney')}</div>
              </div>
              <div className="q-mb-op">+</div>
              <div className="q-mb-cell gold">
                <div className="q-mb-val">{'\u20b9'}1.5K</div>
                <div className="q-mb-sub" style={{whiteSpace:'pre-line'}}>{t('proAccess.step5.freeBet')}</div>
              </div>
              <div className="q-mb-op">=</div>
              <div className="q-mb-cell blue">
                <div className="q-mb-val">{'\u20b9'}2.5K</div>
                <div className="q-mb-sub" style={{whiteSpace:'pre-line'}}>{t('proAccess.step5.totalTo')}</div>
              </div>
            </div>
            <div className="q-mb-note">{t('proAccess.step5.mathNote')}</div>
          </div>

          <div className="q-min-alert">
            <div className="q-min-alert-ico">&#128274;</div>
            <div className="q-min-alert-body">
              <div className="q-min-alert-title">{t('proAccess.step5.minAlertTitle')}</div>
              <div className="q-min-alert-text">{t('proAccess.step5.minAlertText')}</div>
            </div>
          </div>

          <div className="q-dgrid">
            <div className={`q-dopt${sel === 0 ? ' sel' : ''}`} onClick={() => setSel(0)}>
              <div className="rtag blue">{t('proAccess.step4.minPro')}</div>
              <div className="da">{'\u20b9'}1,000</div>
              <div className="dl">{t('proAccess.step5.opt1Label')}</div>
              <div className="dbonus">+{'\u20b9'}1,500 free bet</div>
            </div>
            <div className={`q-dopt rec${sel === 1 ? ' sel' : ''}`} onClick={() => setSel(1)}>
              <div className="rtag">{t('proAccess.step5.recommended')}</div>
              <div className="da">{'\u20b9'}2,000</div>
              <div className="dl">{t('proAccess.step5.opt2Label')}</div>
              <div className="dbonus dbonus-green">+{'\u20b9'}3,000 free bet</div>
            </div>
            <div className={`q-dopt${sel === 2 ? ' sel' : ''}`} onClick={() => setSel(2)}>
              <div className="da">{'\u20b9'}5,000</div>
              <div className="dl">{t('proAccess.step5.opt3Label')}</div>
              <div className="dbonus">+{'\u20b9'}7,500 free bet</div>
            </div>
            <div className={`q-dopt${sel === 3 ? ' sel' : ''}`} onClick={() => setSel(3)}>
              <div className="da">{'\u20b9'}10,000</div>
              <div className="dl">{t('proAccess.step5.opt4Label')}</div>
              <div className="dbonus">+{'\u20b9'}15,000 free bet</div>
            </div>
          </div>

          <div className="q-slist">
            <div className="q-slrow"><div className="q-slico blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><h4>{t('proAccess.step5.setup')}</h4><p>{t('proAccess.step5.setupDesc')}</p></div></div>
            <div className="q-slrow"><div className="q-slico green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg></div><div><h4>{t('proAccess.step5.autoActivation')}</h4><p>{t('proAccess.step5.autoActivationDesc')}</p></div></div>
            <div className="q-slrow"><div className="q-slico gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div><h4>{t('proAccess.step5.zeroRisk')}</h4><p>{t('proAccess.step5.zeroRiskDesc')}</p></div></div>
          </div>
          <div style={{ textAlign: 'center' }}><div className="q-sbadge"><div className="q-sdot" />{t('proAccess.step5.usersActivated')}</div></div>
        </div>
        <div className="q-foot">
          <button className="q-btn green" onClick={next}>{t('proAccess.step5.btn')}<Check /></button>
          <div className="q-hint">{t('proAccess.step5.hint')}</div>
        </div>
      </div>

      {/* STEP 6 — Final CTA */}
      <div className={`q-step final${step === 6 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-fhd">
            <div className="q-ficobig"><Download /></div>
            <div className="ft">{t('proAccess.step6.title')}</div>
            <div className="fs">{t('proAccess.step6.subtitle')}</div>
          </div>

          <div className="q-bfloat">
            <div className="q-bfl">{t('proAccess.step6.bankrollLabel')}</div>
            <div className="q-bfa">{t('proAccess.step6.bankrollAmount')}</div>
            <div className="q-bfd">{t('proAccess.step6.bankrollDesc')}</div>
          </div>

          <div className="q-bankroll">
            <div className="q-br-head">{t('proAccess.step6.howFormed')}</div>
            <div className="q-br-row">
              <div className="q-br-label"><span className="g"/>{t('proAccess.step6.depositLabel')}</div>
              <div className="q-br-val g">{'\u20b9'}1,000</div>
            </div>
            <div className="q-br-row">
              <div className="q-br-label"><span className="a"/>{t('proAccess.step6.bonusLabel')}</div>
              <div className="q-br-val a">+{'\u20b9'}1,500</div>
            </div>
            <div className="q-br-total">
              <div className="q-br-total-label">{t('proAccess.step6.totalBalance')}</div>
              <div className="q-br-total-val">{'\u20b9'}2,500</div>
            </div>
          </div>

          <div className="q-mflow">
            <div className="q-mstep"><div className="q-mnum">1</div><div className="q-mlbl">{t('proAccess.step6.flowRegister')}</div></div>
            <div className="q-marr">&#8594;</div>
            <div className="q-mstep"><div className="q-mnum">2</div><div className="q-mlbl">{t('proAccess.step6.flowDeposit')}</div></div>
            <div className="q-marr">&#8594;</div>
            <div className="q-mstep"><div className="q-mnum">3</div><div className="q-mlbl">{t('proAccess.step6.flowAmount')}</div></div>
            <div className="q-marr">&#8594;</div>
            <div className="q-mstep"><div className="q-mnum done"><CheckBold /></div><div className="q-mlbl">{t('proAccess.step6.flowDone')}</div></div>
          </div>
          <div className="q-fgrid">
            <div className="q-fchip"><Check /> {t('proAccess.step6.chipUnlimitedAi')}</div>
            <div className="q-fchip"><Check /> {t('proAccess.step6.chipLiveBetting')}</div>
            <div className="q-fchip"><Check /> {t('proAccess.step6.chipValueBet')}</div>
            <div className="q-fchip"><Check /> {t('proAccess.step6.chipFastWithdraw')}</div>
          </div>
          <div className="q-trow">
            <div className="q-tchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> {t('proAccess.step6.secure')}</div>
            <div className="q-tchip"><Check /> {t('proAccess.step6.licensed')}</div>
            <div className="q-tchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 4.9/5</div>
          </div>
          <div className="q-review">
            <div className="q-rav">R</div>
            <div><div className="q-rtext">{t('proAccess.step6.review')}</div><div className="q-rname"><span className="q-rstar">&#9733;&#9733;&#9733;&#9733;&#9733;</span> {t('proAccess.step6.reviewName')}</div></div>
          </div>
        </div>
        <div className="q-foot">
          <a
            href={bookmakerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="q-btn gold"
            style={{ textDecoration: 'none' }}
          >
            <Download />{t('proAccess.step6.btn')}
          </a>
          <div className="q-hint">{t('proAccess.step6.hint')}</div>
        </div>
      </div>
    </div>
  );
}
