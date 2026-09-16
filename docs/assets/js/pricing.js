from pathlib import Path
import json, re, zipfile

root=Path("/mnt/data/rcw-pricing-update")
(root/"assets/js").mkdir(parents=True,exist_ok=True)
(root/"assets/data").mkdir(parents=True,exist_ok=True)

src=Path("/mnt/data/Pricing.txt").read_text()
html=src.split('\n{\n  "_changeNotes"')[0].rstrip()
html=html.replace("The final calculated travel charge is rounded up to the next whole dollar.","The final calculated travel charge is shown to the nearest cent.")
html=html.replace("The calculated travel charge is rounded up to the next whole dollar.","The calculated travel charge is shown to the nearest cent.")

# Top-right detailed receipt
a=html.index('<aside\n          class="availability-card"')
b=html.index('</aside>',a)+len('</aside>')
card='''<aside class="availability-card" aria-label="Pricing highlights">
<p class="card-label">Detailed Starting Price</p>
<h2>No guessing.</h2>
<p>Applicable charges are itemized before booking.</p>
<div class="price-breakdown">
<p><span>Mobile Service Fee</span><strong id="top-mobile-base">$40.00</strong></p>
<p><span>First Notarial Act</span><strong id="top-notary">$10.00</strong></p>
<p class="estimate-total"><span>Starting Total</span><strong id="top-starting-total">$50.00</strong></p>
</div>
<p class="small-print">Travel and optional scheduling charges appear only when they apply.</p>
<a class="text-link" href="contact.html">Request a quote</a>
</aside>'''
html=html[:a]+card+html[b:]

# Replace calculator breakdown only
a=html.index('<div class="price-breakdown">', html.index('Estimated Mobile Appointment'))
b=html.index('</div>',a)+len('</div>')
receipt='''<div class="price-breakdown" id="mobile-receipt">
<p><span>Mobile Service Fee</span><strong id="estimate-mobile-base">$40.00</strong></p>
<p id="receipt-distance-row" hidden><span>Round-Trip Distance</span><strong id="estimate-distance"></strong></p>
<p id="receipt-travel-row" hidden><span>Calculated Travel Charge</span><strong id="estimate-travel"></strong></p>
<p><span id="estimate-notary-label">Notarial Act (1 × $10.00)</span><strong id="estimate-notary">$10.00</strong></p>
<p id="receipt-special-row" hidden><span id="estimate-special-label">Scheduling Fee</span><strong id="estimate-special"></strong></p>
<p class="estimate-total"><span>Estimated Total</span><strong id="estimate-total">$50.00</strong></p>
</div>'''
html=html[:a]+receipt+html[b:]
html='''<!-- RCW PRICING | Detailed receipt update | 2026-09-16
Zero-value optional charges are hidden. Travel displays to cent precision.
Preserve assets/css/styles.css, assets/js/main.js and this note. -->
'''+html
(root/"pricing.html").write_text(html)

cfg={"_changeNotes":{"file":"pricing.json","version":"1.2","date":"September 16, 2026","changes":["Travel now uses cent precision.","Zero-value optional receipt rows are hidden."]},"effectiveDate":"2026-08-17","lastUpdated":"2026-09-16","inPersonNotary":10.00,"ronNotary":25.00,"ronService":22.00,"mobileBase":40.00,"premiumGasBenchmark":4.15,"operatingAllowance":1.00,"vehicleMpg":25,"travelOriginZip":"33594","roundTripMultiplier":2,"travelRounding":"centPrecision","sameDay":20.00,"afterHours":25.00,"holiday":35.00,"waitingPer15Minutes":15.00,"automaticTravelRadius":40,"standardTravelRadius":150}
(root/"assets/data/pricing.json").write_text(json.dumps(cfg,indent=2))

js=r'''/* RCW pricing.js v1.2 | 2026-09-16 */
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
});'''
(root/"assets/js/pricing.js").write_text(js)

z=Path("/mnt/data/rcw-pricing-detailed-receipt-update.zip")
with zipfile.ZipFile(z,"w",zipfile.ZIP_DEFLATED) as f:
    for pth in root.rglob("*"):
        if pth.is_file(): f.write(pth,pth.relative_to(root))
print("Created complete pricing update:",z)
