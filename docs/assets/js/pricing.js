/* RCW pricing.js v1.2 | 2026-09-16 */
document.addEventListener("DOMContentLoaded",async()=>{
let p={inPersonNotary:10,ronNotary:25,ronService:22,mobileBase:40,premiumGasBenchmark:4.15,operatingAllowance:1,vehicleMpg:25,roundTripMultiplier:2,sameDay:20,afterHours:25,holiday:35,waitingPer15Minutes:15};
try{let r=await fetch("assets/data/pricing.json",{cache:"no-store"});if(r.ok)p={...p,...await r.json()}}catch(e){console.warn("Using fallback pricing.",e)}
const $=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(+n||0);
const c=n=>Math.round((+n+Number.EPSILON)*100)/100;
const t=(id,v)=>{let e=document.getElementById(id);if(e)e.textContent=v};
const sh=(id,on)=>{let e=document.getElementById(id);if(e)e.hidden=!on};
[["in-person-price",p.inPersonNotary],["ron-notary-price",p.ronNotary],["ron-service-price",p.ronService],["mobile-base-price",p.mobileBase],["same-day-price",p.sameDay],["after-hours-price",p.afterHours],["holiday-price",p.holiday],["waiting-price",p.waitingPer15Minutes]].forEach(x=>t(x[0],$(x[1])));
t("ron-preview-notary",$(p.ronNotary));t("ron-preview-service",$(p.ronService));t("ron-preview-total",$(c(+p.ronNotary + +p.ronService)));
t("top-mobile-base",$(p.mobileBase));t("top-notary",$(p.inPersonNotary));t("top-starting-total",$(c(+p.mobileBase + +p.inPersonNotary)));
function calc(){
let mi=Math.max(0,+document.getElementById("one-way-miles")?.value||0);
let acts=Math.max(1,Math.floor(+document.getElementById("notarial-acts")?.value||1));
let typ=document.getElementById("appointment-type")?.value||"standard";
let rt=c(mi*(+p.roundTripMultiplier||2));
let rate=(+p.premiumGasBenchmark + +p.operatingAllowance)/(+p.vehicleMpg);
let travel=c(rt*rate),notary=c(acts*(+p.inPersonNotary));
let sp=typ==="same-day"?+p.sameDay:typ==="after-hours"?+p.afterHours:typ==="holiday"?+p.holiday:0;
let label=typ==="same-day"?"Same-Day Priority":typ==="after-hours"?"After-Hours Appointment":typ==="holiday"?"Holiday Appointment":"";
t("estimate-mobile-base",$(p.mobileBase));
sh("receipt-distance-row",rt>0);if(rt>0)t("estimate-distance",rt.toFixed(1)+" miles");
sh("receipt-travel-row",travel>0);if(travel>0)t("estimate-travel",$(travel));
t("estimate-notary-label",`Notarial Act${acts===1?"":"s"} (${acts} × ${$(p.inPersonNotary)})`);t("estimate-notary",$(notary));
sh("receipt-special-row",sp>0);if(sp>0){t("estimate-special-label",label);t("estimate-special",$(sp))}
t("estimate-total",$(c(+p.mobileBase+notary+travel+sp)));
}
document.getElementById("calculate-mobile")?.addEventListener("click",calc);calc();
});
