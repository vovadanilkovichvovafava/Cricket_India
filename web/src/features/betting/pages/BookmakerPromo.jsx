import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ENV } from '../../../shared/config/env';

const TOTAL = 6;

const AFFILIATE_LINK = 'https://siteofficialred.com/Qhs6z2nP?external_id={external_id}&sub_id_1={sub_id_1}';
function getOfferLink() {
  const base = ENV.BOOKMAKER_LINK !== '#' ? ENV.BOOKMAKER_LINK : AFFILIATE_LINK;
  return base.replace('{external_id}', 'cricketbaazi_offer').replace(/\{sub_id_\d+\}/g, '');
}

// Shared quiz CSS — adapted for Indian cricket (orange #FF9933)
const quizCSS = `
:root{--qbg:#EEF1F7;--qcard:#FFF;--qprimary:#1B3A5C;--qaccent:#FF9933;--qgreen:#1DAA61;--qblue:#2B7AE8;--qpurple:#6366F1;--qred:#EF4444;--qtext:#1E293B;--qtext2:#5A6B80;--qtext3:#94A3B8;--qborder:#E2E8F0;--orange-g:linear-gradient(135deg,#FF9933 0%,#FF8800 100%);--blue-g:linear-gradient(135deg,#2B7AE8 0%,#1B6DD9 100%);--green-g:linear-gradient(135deg,#1DAA61 0%,#16894E 100%);--dark-g:linear-gradient(160deg,#0F2744 0%,#1B3A5C 40%,#2B5A8C 100%)}
@keyframes qfadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes qscaleIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
@keyframes qshimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes qpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes qblink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes qbarGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}

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
.q-sico{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:qscaleIn .4s cubic-bezier(.34,1.56,.64,1) .07s both}.q-sico svg{width:22px;height:22px}.q-sico.blue{background:#DBEAFE}.q-sico.blue svg{color:var(--qblue)}.q-sico.gold{background:#FFF7ED}.q-sico.gold svg{color:var(--qaccent)}.q-sico.green{background:#D1FAE5}.q-sico.green svg{color:var(--qgreen)}.q-sico.purple{background:#EDE9FE}.q-sico.purple svg{color:var(--qpurple)}.q-sico.red{background:#FEE2E2}.q-sico.red svg{color:var(--qred)}
.q-stit{font-size:20px;font-weight:800;color:var(--qprimary);line-height:1.2;animation:qfadeUp .35s ease .12s both;white-space:pre-line}.q-ssub{font-size:13px;color:var(--qtext2);line-height:1.5;animation:qfadeUp .35s ease .18s both}
.q-ctable{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);overflow:hidden;animation:qfadeUp .35s ease .24s both;flex-shrink:0}.q-chead{padding:9px 13px;background:var(--qbg);border-bottom:1px solid var(--qborder);font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.6px;display:flex;align-items:center;gap:6px}.q-chead svg{width:12px;height:12px}
.q-crow{display:flex;align-items:center;gap:10px;padding:8px 13px;border-bottom:1px solid var(--qborder)}.q-crow:last-child{border-bottom:none}.q-cname{width:96px;font-size:11px;font-weight:600;color:var(--qtext2);flex-shrink:0}.q-cname.top{color:var(--qprimary);font-weight:800}
.q-bwrap{flex:1;height:26px;background:#F1F5F9;border-radius:6px;overflow:hidden}.q-bar{height:100%;border-radius:6px;display:flex;align-items:center;padding:0 9px;font-size:12px;font-weight:800;transform-origin:left;animation:qbarGrow .7s ease both}.q-bar.top{background:var(--green-g);color:#fff}.q-bar.other{background:#CBD5E1;color:var(--qtext2)}.q-btag{margin-left:auto;background:rgba(255,255,255,.22);color:#fff;font-size:8px;font-weight:800;letter-spacing:.4px;padding:2px 6px;border-radius:4px;text-transform:uppercase}
.q-callout{border-radius:12px;padding:11px 13px;font-size:12px;line-height:1.6;color:var(--qtext2);animation:qfadeUp .35s ease both;flex-shrink:0}.q-callout strong{color:var(--qtext)}.q-callout.gold{background:#FFF7ED;border:1px solid rgba(255,153,51,.32)}.q-callout.blue{background:#EFF6FF;border:1px solid rgba(43,122,232,.22)}.q-callout.green{background:#F0FDF4;border:1px solid rgba(29,170,97,.28)}
.q-bigstat{background:var(--qcard);border-radius:14px;border:1px solid var(--qborder);padding:16px 16px 14px;text-align:center;flex-shrink:0;position:relative;overflow:hidden;animation:qscaleIn .45s cubic-bezier(.34,1.56,.64,1) .2s both}.q-bigstat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--orange-g)}.q-bigstat .bl{font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px}.q-bigstat .bv{font-size:48px;font-weight:900;line-height:1;background:var(--orange-g);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:qshimmer 3s linear infinite}.q-bigstat .bd{font-size:12px;color:var(--qtext2);margin-top:4px}
.q-srow{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;flex-shrink:0}.q-sbox{background:var(--qcard);border:1px solid var(--qborder);border-radius:12px;padding:11px 8px;text-align:center;animation:qfadeUp .35s ease both}.q-sbox .sv{font-size:18px;font-weight:900;color:var(--qblue);display:block}.q-sbox .sl{font-size:9px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.4px;margin-top:2px;display:block}
.q-fcard{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);padding:11px 12px;animation:qfadeUp .35s ease both;display:flex;align-items:center;gap:11px;position:relative;overflow:hidden;flex-shrink:0}.q-fcard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px}.q-fcard.blue::before{background:var(--blue-g)}.q-fcard.gold::before{background:var(--orange-g)}.q-fcard.green::before{background:var(--green-g)}.q-fcard.purple::before{background:linear-gradient(180deg,#6366F1,#4F46E5)}
.q-fico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.q-fico svg{width:17px;height:17px}.q-fico.blue{background:#DBEAFE}.q-fico.blue svg{color:var(--qblue)}.q-fico.gold{background:#FFF7ED}.q-fico.gold svg{color:var(--qaccent)}.q-fico.green{background:#D1FAE5}.q-fico.green svg{color:var(--qgreen)}.q-fico.purple{background:#EDE9FE}.q-fico.purple svg{color:var(--qpurple)}
.q-ftit{font-size:13px;font-weight:800;color:var(--qtext);margin-bottom:2px}.q-fdsc{font-size:11px;color:var(--qtext2);line-height:1.45}
.q-dgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex-shrink:0}.q-dopt{border-radius:12px;padding:13px 10px;cursor:pointer;transition:all .2s;background:var(--qcard);border:2px solid var(--qborder);position:relative;text-align:center;animation:qfadeUp .35s ease both}.q-dopt:active{transform:scale(.97)}.q-dopt.sel{border-color:var(--qaccent);background:#FFF7ED}.q-dopt.rec{border-color:var(--qgreen);background:#F0FDF4}.q-dopt .rtag{position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:var(--green-g);color:#fff;font-size:9px;font-weight:800;padding:2px 9px;border-radius:100px;white-space:nowrap}.q-dopt .da{font-size:22px;font-weight:900;color:var(--qprimary)}.q-dopt .dl{font-size:10px;color:var(--qtext3);font-weight:600;margin-top:1px}.q-dopt .db{font-size:10px;font-weight:800;color:var(--qaccent);background:#FFF7ED;border-radius:6px;padding:2px 7px;display:inline-block;margin-top:5px}.q-dopt.rec .db{color:var(--qgreen);background:#D1FAE5}
.q-cklist{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);overflow:hidden;flex-shrink:0}.q-ckrow{display:flex;align-items:center;gap:10px;padding:10px 13px;border-bottom:1px solid var(--qborder);animation:qfadeUp .35s ease both}.q-ckrow:last-child{border-bottom:none}.q-ckdot{width:22px;height:22px;border-radius:50%;background:var(--green-g);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}.q-ckdot svg{width:11px;height:11px}.q-ckrow h4{font-size:12px;font-weight:700;color:var(--qtext)}.q-ckrow p{font-size:11px;color:var(--qtext2);margin-top:1px}
.q-abadge{display:inline-flex;align-items:center;gap:7px;background:#FEF2F2;border:1px solid #FECACA;border-radius:9px;padding:7px 14px;font-size:12px;font-weight:700;color:#991B1B}.q-adot{width:6px;height:6px;border-radius:50%;background:var(--qred);animation:qblink 1.2s infinite}
.q-step.final .q-body{padding:0;justify-content:space-between}
.q-fhd{background:var(--dark-g);padding:38px 20px 24px;text-align:center;position:relative;overflow:hidden;flex-shrink:0}.q-fhd::before{content:'';position:absolute;top:-50px;right:-30px;width:150px;height:150px;border-radius:50%;background:rgba(255,153,51,.08)}
.q-ficobig{width:56px;height:56px;border-radius:18px;background:var(--orange-g);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 6px 22px rgba(255,153,51,.36);position:relative;z-index:1;animation:qscaleIn .45s cubic-bezier(.34,1.56,.64,1) both}.q-ficobig svg{width:26px;height:26px;color:#fff}.q-fhd .ft{font-size:22px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:5px;position:relative;z-index:1}.q-fhd .fs{font-size:13px;color:rgba(255,255,255,.6);position:relative;z-index:1}
.q-bfloat{margin:-18px 14px 0;position:relative;z-index:2;background:var(--qcard);border-radius:16px;padding:15px;text-align:center;box-shadow:0 10px 34px rgba(0,0,0,.11);border:1px solid var(--qborder);animation:qfadeUp .45s ease .2s both;flex-shrink:0}.q-bfl{font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.7px}.q-bfa{font-size:40px;font-weight:900;line-height:1.1;background:var(--orange-g);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:qshimmer 3s linear infinite;margin:3px 0}.q-bfd{font-size:12px;color:var(--qtext2)}
.q-mflow{display:flex;align-items:center;justify-content:center;gap:5px;padding:12px 14px 4px;animation:qfadeUp .35s ease .32s both;flex-shrink:0}.q-mstep{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}.q-mnum{width:28px;height:28px;border-radius:50%;background:var(--blue-g);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}.q-mnum.done{background:var(--green-g)}.q-mnum.done svg{width:13px;height:13px;color:#fff}.q-mlbl{font-size:9px;color:var(--qtext2);text-align:center;font-weight:600;line-height:1.3}.q-marr{color:var(--qtext3);font-size:14px;margin-top:-12px;flex-shrink:0}
.q-fgrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:8px 14px 0;animation:qfadeUp .35s ease .38s both;flex-shrink:0}.q-fchip{background:var(--qcard);border:1px solid var(--qborder);border-radius:9px;padding:7px 10px;font-size:11px;font-weight:600;color:var(--qtext2);display:flex;align-items:center;gap:6px}.q-fchip svg{width:11px;height:11px;color:var(--qgreen);flex-shrink:0}
.q-trow{display:flex;justify-content:center;gap:7px;padding:8px 14px 0;flex-wrap:wrap;animation:qfadeUp .35s ease .44s both;flex-shrink:0}.q-tchip{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:var(--qtext3);background:var(--qcard);border:1px solid var(--qborder);border-radius:100px;padding:4px 10px}.q-tchip svg{width:10px;height:10px}
.q-review{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);padding:12px 13px;flex-shrink:0;animation:qfadeUp .35s ease .52s both;display:flex;align-items:flex-start;gap:10px;margin:0 14px}.q-rav{width:32px;height:32px;border-radius:50%;background:var(--dark-g);color:rgba(255,255,255,.9);font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}.q-rtext{font-size:12px;color:var(--qtext2);line-height:1.5}.q-rname{font-size:11px;font-weight:700;color:var(--qtext3);margin-top:4px;display:flex;align-items:center;gap:5px}.q-rstar{color:#FF9933;font-size:10px;letter-spacing:1px}
.q-bonus-hd{background:linear-gradient(135deg,#0F2744 0%,#1B3A5C 100%);border-radius:14px;padding:16px;text-align:center;flex-shrink:0;position:relative;overflow:hidden;animation:qfadeUp .35s ease both}
.q-bonus-hd::before{content:'';position:absolute;top:-40px;right:-40px;width:130px;height:130px;border-radius:50%;background:rgba(255,153,51,.12)}
.q-bhtag{display:inline-flex;align-items:center;gap:6px;background:rgba(255,153,51,.18);border:1px solid rgba(255,153,51,.35);border-radius:100px;padding:4px 12px;font-size:10px;font-weight:800;color:#FF9933;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
.q-bhdot{width:5px;height:5px;border-radius:50%;background:#FF9933;animation:qblink 1.2s infinite;flex-shrink:0}
.q-bhttl{font-size:19px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:5px}
.q-bhsub{font-size:12px;color:rgba(255,255,255,.5);line-height:1.5}
.q-calc{background:var(--qcard);border:1px solid var(--qborder);border-radius:14px;overflow:hidden;flex-shrink:0;animation:qfadeUp .35s ease .15s both}
.q-copts{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--qborder)}
.q-copt{padding:11px 4px;text-align:center;cursor:pointer;transition:background .18s;border-right:1px solid var(--qborder);position:relative}
.q-copt:last-child{border-right:none}
.q-copt.on{background:#FFF7ED}
.q-copt .cv{font-size:14px;font-weight:900;color:var(--qprimary)}
.q-copt.on .cv{color:var(--qaccent)}
.q-copt .cl{font-size:9px;color:var(--qtext3);font-weight:600;margin-top:2px}
.q-copt .crec{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1DAA61,#16894E);color:#fff;font-size:8px;font-weight:800;padding:2px 7px;border-radius:100px;white-space:nowrap}
.q-cres{padding:14px 16px;display:flex;flex-direction:column;gap:9px}
.q-cres-row{display:flex;align-items:center;justify-content:space-between}
.q-cres-lbl{font-size:11px;color:var(--qtext3);font-weight:600}
.q-cres-val{font-size:13px;font-weight:800;color:var(--qtext)}
.q-cbonus{display:flex;align-items:center;gap:8px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:10px 12px}
.q-cbonus-ico{font-size:22px;flex-shrink:0}
.q-cbonus-ttl{font-size:13px;font-weight:800;color:var(--qgreen)}
.q-cbonus-sub{font-size:11px;color:var(--qtext2);margin-top:1px}
.q-ctotal{background:var(--dark-g);border-radius:11px;padding:12px;text-align:center}
.q-ctotal-lbl{font-size:10px;color:rgba(255,255,255,.5);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}
.q-ctotal-num{font-size:34px;font-weight:900;background:var(--orange-g);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:qshimmer 3s linear infinite;line-height:1}
.q-ctotal-sub{font-size:11px;color:rgba(255,255,255,.4);margin-top:3px}
.q-once{background:#FFF5F5;border:1px solid rgba(239,68,68,.22);border-radius:12px;padding:11px 13px;display:flex;align-items:center;gap:10px;flex-shrink:0;animation:qfadeUp .35s ease .3s both}
.q-once-ico{font-size:20px;flex-shrink:0}
.q-once-txt{font-size:12px;color:#B91C1C;line-height:1.5;font-weight:600}
.q-once-txt strong{color:#991B1B}
.q-bet-ex{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);overflow:hidden;flex-shrink:0;animation:qfadeUp .35s ease .58s both}.q-bet-ex-head{padding:8px 13px;background:#F8FAFC;border-bottom:1px solid var(--qborder);font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.6px;display:flex;align-items:center;gap:6px}.q-bet-ex-head svg{width:11px;height:11px}.q-bet-row{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;border-bottom:1px solid var(--qborder)}.q-bet-row:last-child{border-bottom:none}.q-bet-name{font-size:12px;font-weight:600;color:var(--qtext2)}.q-bet-name.top{color:var(--qprimary);font-weight:800}.q-bet-gain{font-size:13px;font-weight:800}.q-bet-gain.top{color:var(--qgreen)}.q-bet-gain.gray{color:var(--qtext3)}.q-bet-diff{background:#F0FDF4;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:800;color:var(--qgreen)}
.q-proj{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);padding:12px 13px;flex-shrink:0;animation:qfadeUp .35s ease .54s both}.q-proj-title{font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;display:flex;align-items:center;gap:6px}.q-proj-title svg{width:11px;height:11px}.q-prow{display:flex;align-items:center;gap:10px;margin-bottom:7px}.q-prow:last-child{margin-bottom:0}.q-plbl{font-size:11px;font-weight:700;color:var(--qtext2);width:42px;flex-shrink:0}.q-pbg{flex:1;height:22px;background:#F1F5F9;border-radius:6px;overflow:hidden}.q-pbar2{height:100%;border-radius:6px;display:flex;align-items:center;padding:0 9px;font-size:11px;font-weight:800;color:#fff;transform-origin:left;animation:qbarGrow .8s cubic-bezier(.22,1,.36,1) both}.q-pbar2.s1{background:var(--blue-g);animation-delay:.6s}.q-pbar2.s2{background:linear-gradient(135deg,#1DAA61,#2B7AE8);animation-delay:.72s}.q-pbar2.s3{background:var(--orange-g);animation-delay:.84s;color:#fff}
.q-pay-row{background:var(--qcard);border-radius:13px;border:1px solid var(--qborder);padding:11px 13px;flex-shrink:0;animation:qfadeUp .35s ease .6s both}.q-pay-title{font-size:10px;font-weight:700;color:var(--qtext3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:9px;display:flex;align-items:center;gap:6px}.q-pay-title svg{width:11px;height:11px}.q-pay-chips{display:flex;gap:7px;flex-wrap:wrap}.q-pchip{background:#F8FAFC;border:1px solid var(--qborder);border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;color:var(--qtext2);display:flex;align-items:center;gap:5px}.q-pchip svg{width:13px;height:13px;color:var(--qblue)}
`;

const ArrowRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const CheckBold = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const Download = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const Clock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;
const Card = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;

function H({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

const calcTiers = [
  { dep: '\u20b91,000',  bonus: '\u20b91,500',  total: '\u20b92,500'  },
  { dep: '\u20b92,000',  bonus: '\u20b93,000',  total: '\u20b95,000'  },
  { dep: '\u20b95,000',  bonus: '\u20b97,500',  total: '\u20b912,500' },
  { dep: '\u20b910,000', bonus: '\u20b915,000', total: '\u20b925,000' },
];

export default function BookmakerPromo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState(1);
  const [calcSel, setCalcSel] = useState(1);
  const bookmakerLink = getOfferLink();

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

      {/* STEP 1 — Bonus Calculator */}
      <div className={`q-step${step === 1 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-bonus-hd">
            <div className="q-bhtag"><div className="q-bhdot" />{t('betPromo.step1.tag')}</div>
            <div className="q-bhttl"><H html={t('betPromo.step1.title')} /></div>
            <div className="q-bhsub">{t('betPromo.step1.subtitle')}</div>
          </div>

          <div className="q-calc">
            <div className="q-copts">
              {calcTiers.map((o, i) => (
                <div key={i} className={`q-copt${calcSel===i?' on':''}`} onClick={()=>setCalcSel(i)}>
                  {i === 1 && <div className="crec">{t('betPromo.step1.popular')}</div>}
                  <div className="cv">{o.dep}</div>
                  <div className="cl">{[t('betPromo.step1.tierStart'), t('betPromo.step1.tierPopular'), t('betPromo.step1.tierTop'), t('betPromo.step1.tierMax')][i]}</div>
                </div>
              ))}
            </div>
            <div className="q-cres">
              {calcTiers.map((o, i) => calcSel===i && (
                <div key={i} style={{display:'contents'}}>
                  <div className="q-cres-row">
                    <div className="q-cres-lbl">{t('betPromo.step1.yourDeposit')}</div>
                    <div className="q-cres-val">{o.dep}</div>
                  </div>
                  <div className="q-cbonus">
                    <div className="q-cbonus-ico">🎁</div>
                    <div>
                      <div className="q-cbonus-ttl">+{o.bonus} {t('betPromo.step1.freeBonus')}</div>
                      <div className="q-cbonus-sub">{t('betPromo.step1.creditedAuto')}</div>
                    </div>
                  </div>
                  <div className="q-ctotal">
                    <div className="q-ctotal-lbl">{t('betPromo.step1.totalBankroll')}</div>
                    <div className="q-ctotal-num">{o.total}</div>
                    <div className="q-ctotal-sub">{t('betPromo.step1.totalSub')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="q-once">
            <div className="q-once-ico">&#9888;&#65039;</div>
            <div className="q-once-txt">
              <H html={t('betPromo.step1.onceWarn')} />
            </div>
          </div>
        </div>
        <div className="q-foot">
          <button className="q-btn gold" onClick={next}>
            {t('betPromo.step1.btn')} <ArrowRight />
          </button>
          <div className="q-hint">{t('betPromo.step1.hint')}</div>
        </div>
      </div>

      {/* STEP 2 — Odds Comparison */}
      <div className={`q-step${step === 2 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-sico blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div className="q-stit">{t('betPromo.step2.title')}</div>
          <div className="q-ssub">{t('betPromo.step2.subtitle')}</div>
          <div className="q-ctable">
            <div className="q-chead"><Clock />{t('betPromo.step2.tableHead')}</div>
            <div className="q-crow"><div className="q-cname top">{t('betPromo.step2.ourPartner')}</div><div className="q-bwrap"><div className="q-bar top" style={{ width: '95%' }}>2.15 <span className="q-btag">TOP</span></div></div></div>
            <div className="q-crow"><div className="q-cname">Betway</div><div className="q-bwrap"><div className="q-bar other" style={{ width: '82%' }}>1.95</div></div></div>
            <div className="q-crow"><div className="q-cname">10CRIC</div><div className="q-bwrap"><div className="q-bar other" style={{ width: '78%' }}>1.88</div></div></div>
            <div className="q-crow"><div className="q-cname">Parimatch</div><div className="q-bwrap"><div className="q-bar other" style={{ width: '86%' }}>2.02</div></div></div>
          </div>
          <div className="q-callout gold"><strong>{t('betPromo.step2.calloutBold')}</strong> {t('betPromo.step2.callout')}</div>
          <div className="q-bet-ex">
            <div className="q-bet-ex-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {t('betPromo.step2.betExample')}
            </div>
            <div className="q-bet-row"><div className="q-bet-name top">{t('betPromo.step2.ourPartner')} (2.15)</div><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div className="q-bet-gain top">{'\u20b9'}1,150</div><div className="q-bet-diff">+{'\u20b9'}200</div></div></div>
            <div className="q-bet-row"><div className="q-bet-name">Betway (1.95)</div><div className="q-bet-gain gray">{'\u20b9'}950</div></div>
            <div className="q-bet-row"><div className="q-bet-name">Parimatch (2.02)</div><div className="q-bet-gain gray">{'\u20b9'}1,020</div></div>
          </div>
        </div>
        <div className="q-foot"><button className="q-btn blue" onClick={next}>{t('betPromo.step2.btn')}<ArrowRight /></button></div>
      </div>

      {/* STEP 3 — Lost Profit */}
      <div className={`q-step${step === 3 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-sico red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div className="q-stit">{t('betPromo.step3.title')}</div>
          <div className="q-ssub">{t('betPromo.step3.subtitle')}</div>
          <div className="q-bigstat"><div className="bl">{t('betPromo.step3.statLabel')}</div><div className="bv">{'\u20b9'}4,200</div><div className="bd">{t('betPromo.step3.statDesc')}</div></div>
          <div className="q-srow">
            <div className="q-sbox"><span className="sv">+8%</span><span className="sl">{t('betPromo.step3.higherOdds')}</span></div>
            <div className="q-sbox"><span className="sv">{'\u20b9'}50K+</span><span className="sl">{t('betPromo.step3.extraAnnual')}</span></div>
            <div className="q-sbox"><span className="sv">87%</span><span className="sl">{t('betPromo.step3.aiAccuracy')}</span></div>
          </div>
          <div className="q-callout blue"><strong>{t('betPromo.step3.calloutBold')}</strong> {t('betPromo.step3.callout')}</div>
          <div className="q-proj">
            <div className="q-proj-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              {t('betPromo.step3.projTitle')}
            </div>
            <div className="q-prow"><div className="q-plbl">{t('betPromo.step3.month1')}</div><div className="q-pbg"><div className="q-pbar2 s1" style={{ width: '27%' }}>{'\u20b9'}4.2K</div></div></div>
            <div className="q-prow"><div className="q-plbl">{t('betPromo.step3.month6')}</div><div className="q-pbg"><div className="q-pbar2 s2" style={{ width: '55%' }}>{'\u20b9'}25K</div></div></div>
            <div className="q-prow"><div className="q-plbl">{t('betPromo.step3.month12')}</div><div className="q-pbg"><div className="q-pbar2 s3" style={{ width: '95%' }}>{'\u20b9'}50K+</div></div></div>
          </div>
        </div>
        <div className="q-foot"><button className="q-btn blue" onClick={next}>{t('betPromo.step3.btn')}<ArrowRight /></button></div>
      </div>

      {/* STEP 4 — What You Get */}
      <div className={`q-step${step === 4 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-sico gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
          </div>
          <div className="q-stit">{t('betPromo.step4.title')}</div>
          <div className="q-fcard gold">
            <div className="q-fico gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
            <div>
              <div className="q-ftit">{t('betPromo.step4.bonusTitle')}</div>
              <div className="q-fdsc">{t('betPromo.step4.bonusDesc')}</div>
            </div>
          </div>
          <div className="q-fcard blue">
            <div className="q-fico blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 4c1 3 1 6 0 8s-1 6 0 8"/><path d="M16 4c-1 3-1 6 0 8s1 6 0 8"/></svg></div>
            <div>
              <div className="q-ftit">{t('betPromo.step4.liveTitle')}</div>
              <div className="q-fdsc">{t('betPromo.step4.liveDesc')}</div>
            </div>
          </div>
          <div className="q-fcard green">
            <div className="q-fico green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
            <div>
              <div className="q-ftit">{t('betPromo.step4.clickTitle')}</div>
              <div className="q-fdsc">{t('betPromo.step4.clickDesc')}</div>
            </div>
          </div>
          <div className="q-fcard purple">
            <div className="q-fico purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
            <div>
              <div className="q-ftit">{t('betPromo.step4.oddsTitle')}</div>
              <div className="q-fdsc">{t('betPromo.step4.oddsDesc')}</div>
            </div>
          </div>
          <div className="q-fcard">
            <div className="q-fico green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
            <div>
              <div className="q-ftit">{t('betPromo.step4.withdrawTitle')}</div>
              <div className="q-fdsc">{t('betPromo.step4.withdrawDesc')}</div>
            </div>
          </div>
        </div>
        <div className="q-foot"><button className="q-btn blue" onClick={next}>{t('betPromo.step4.btn')}<ArrowRight /></button></div>
      </div>

      {/* STEP 5 — Deposit Amount */}
      <div className={`q-step${step === 5 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-sico green"><Clock /></div>
          <div className="q-stit">{t('betPromo.step5.title')}</div>
          <div className="q-ssub">{t('betPromo.step5.subtitle')}</div>
          <div className="q-dgrid">
            <div className={`q-dopt${sel === 0 ? ' sel' : ''}`} onClick={() => setSel(0)}>
              <div className="da">{'\u20b9'}1,000</div>
              <div className="dl">{t('betPromo.step5.optStart')}</div>
              <div className="db">+{'\u20b9'}1,500 bonus</div>
            </div>
            <div className={`q-dopt rec${sel === 1 ? ' sel' : ''}`} onClick={() => setSel(1)}>
              <div className="rtag">{t('betPromo.step5.recommended')}</div>
              <div className="da">{'\u20b9'}2,000</div>
              <div className="dl">{t('betPromo.step5.optPopular')}</div>
              <div className="db">+{'\u20b9'}3,000 bonus</div>
            </div>
            <div className={`q-dopt${sel === 2 ? ' sel' : ''}`} onClick={() => setSel(2)}>
              <div className="da">{'\u20b9'}5,000</div>
              <div className="dl">{t('betPromo.step5.optSerious')}</div>
              <div className="db">+{'\u20b9'}7,500 bonus</div>
            </div>
            <div className={`q-dopt${sel === 3 ? ' sel' : ''}`} onClick={() => setSel(3)}>
              <div className="da">{'\u20b9'}10,000</div>
              <div className="dl">{t('betPromo.step5.optMax')}</div>
              <div className="db">+{'\u20b9'}15,000 bonus</div>
            </div>
          </div>
          <div className="q-cklist">
            <div className="q-ckrow"><div className="q-ckdot"><CheckBold /></div><div><h4>{t('betPromo.step5.freeReg')}</h4><p>{t('betPromo.step5.freeRegDesc')}</p></div></div>
            <div className="q-ckrow"><div className="q-ckdot"><CheckBold /></div><div><h4>{t('betPromo.step5.instantBonus')}</h4><p>{t('betPromo.step5.instantBonusDesc')}</p></div></div>
            <div className="q-ckrow"><div className="q-ckdot"><CheckBold /></div><div><h4>{t('betPromo.step5.noRisk')}</h4><p>{t('betPromo.step5.noRiskDesc')}</p></div></div>
          </div>
          <div style={{ textAlign: 'center' }}><div className="q-abadge"><div className="q-adot" />{t('betPromo.step5.badge')}</div></div>
          <div className="q-pay-row">
            <div className="q-pay-title"><Card />{t('betPromo.step5.payTitle')}</div>
            <div className="q-pay-chips">
              <div className="q-pchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>UPI</div>
              <div className="q-pchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>Paytm</div>
              <div className="q-pchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>PhonePe</div>
              <div className="q-pchip"><Card />{t('betPromo.step5.netBanking')}</div>
            </div>
          </div>
        </div>
        <div className="q-foot"><button className="q-btn green" onClick={next}>{t('betPromo.step5.btn')}<Check /></button></div>
      </div>

      {/* STEP 6 — Final CTA */}
      <div className={`q-step final${step === 6 ? ' active' : ''}`}>
        <div className="q-body">
          <div className="q-fhd">
            <div className="q-ficobig"><Download /></div>
            <div className="ft">{t('betPromo.step6.title')}</div>
            <div className="fs">{t('betPromo.step6.subtitle')}</div>
          </div>
          <div className="q-bfloat">
            <div className="q-bfl">{t('betPromo.step6.maxBonusLabel')}</div>
            <div className="q-bfa">{'\u20b9'}15,000</div>
            <div className="q-bfd"><H html={t('betPromo.step6.maxBonusDesc')} /></div>
          </div>
          <div className="q-mflow">
            <div className="q-mstep"><div className="q-mnum">1</div><div className="q-mlbl">{t('betPromo.step6.flowRegister')}</div></div>
            <div className="q-marr">{'\u2192'}</div>
            <div className="q-mstep"><div className="q-mnum">2</div><div className="q-mlbl">{t('betPromo.step6.flowDeposit')}</div></div>
            <div className="q-marr">{'\u2192'}</div>
            <div className="q-mstep"><div className="q-mnum">3</div><div className="q-mlbl">{t('betPromo.step6.flowBet')}</div></div>
            <div className="q-marr">{'\u2192'}</div>
            <div className="q-mstep"><div className="q-mnum done"><CheckBold /></div><div className="q-mlbl">{t('betPromo.step6.flowWin')}</div></div>
          </div>
          <div className="q-fgrid">
            <div className="q-fchip"><Check /> {t('betPromo.step6.chipBonus')}</div>
            <div className="q-fchip"><Check /> {t('betPromo.step6.chipLive')}</div>
            <div className="q-fchip"><Check /> {t('betPromo.step6.chipValueBet')}</div>
            <div className="q-fchip"><Check /> {t('betPromo.step6.chipWithdraw')}</div>
          </div>
          <div className="q-trow">
            <div className="q-tchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> {t('betPromo.step6.secure')}</div>
            <div className="q-tchip"><Check /> {t('betPromo.step6.licensed')}</div>
            <div className="q-tchip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 4.9/5</div>
          </div>
          <div className="q-review">
            <div className="q-rav">V</div>
            <div><div className="q-rtext">{t('betPromo.step6.review')}</div><div className="q-rname"><span className="q-rstar">{'\u2605\u2605\u2605\u2605\u2605'}</span> {t('betPromo.step6.reviewName')}</div></div>
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
            <Download />{t('betPromo.step6.btn')}
          </a>
          <div className="q-hint">{t('betPromo.step6.hint')}</div>
        </div>
      </div>
    </div>
  );
}
