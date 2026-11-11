/** Optional GA4. Do not collect traffic until consent is explicitly accepted. */
import {ga4MeasurementId} from './analytics-config.js';
const valid=/^G-[A-Z0-9]{6,}$/.test(ga4MeasurementId)&&!ga4MeasurementId.includes('REPLACE');
let initialized=false;
function begin(){if(initialized||!valid||window.miAnalyticsConsent?.()!==true)return;initialized=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());window.gtag('consent','default',{analytics_storage:'granted'});
 window.gtag('config',ga4MeasurementId,{send_page_view:true});
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ga4MeasurementId);document.head.append(script);
}
window.addEventListener('mi-consent-change',e=>{
 if(e.detail?.analytics)begin();else if(initialized&&window.gtag)window.gtag('consent','update',{analytics_storage:'denied'});
});
begin();
