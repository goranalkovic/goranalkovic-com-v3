import{D as e,S as s,i as a,s as t,E as r,c as l,a as i,d as c,b as o,F as h,f as n,G as f,H as p,e as v,j as u,k as d,t as g,m,n as b,g as $,o as w,x as E,u as k,v as x,I as A,J as y,K as I}from"../chunks/vendor-b7743159.js";const M={subscribe:s=>(()=>{const s=e("__svelte__");return{page:{subscribe:s.page.subscribe},navigating:{subscribe:s.navigating.subscribe},get preloading(){return console.error("stores.preloading is deprecated; use stores.navigating instead"),{subscribe:s.navigating.subscribe}},session:s.session}})().page.subscribe(s)};function S(e){let s,a,t;return{c(){s=r("svg"),a=r("path"),t=r("path"),this.h()},l(e){s=l(e,"svg",{class:!0,width:!0,height:!0,viewBox:!0,fill:!0,xmlns:!0},1);var r=i(s);a=l(r,"path",{d:!0,class:!0},1),i(a).forEach(c),t=l(r,"path",{d:!0,class:!0},1),i(t).forEach(c),r.forEach(c),this.h()},h(){o(a,"d","M0 0h400v400H0V0z"),o(a,"class","fill-current svelte-12qkcbw"),h(a,"letter-color",e[1]),o(t,"d","M148.649 153.313l76.698-6.036C212.777 85.419 153.57 45.562 81.006 51.273c-83.74 6.59-145.236 70.734-137.164 173.304 7.808 99.202 73.569 155.796 163.432 148.723 80.678-6.349 134.453-60.952 127.826-145.151l-3.265-41.487-135.178 10.639 4.35 55.265 62.154-4.892c1.837 33.128-19.476 55.908-60.504 59.137-46.998 3.699-76.83-28.92-81.577-89.237-4.71-59.858 21.218-96.403 66.686-99.981 30.311-2.386 52.147 10.837 60.883 35.72zM309.33 353.085l15.486-67.455 108.234-8.518 25.848 64.202 81.444-6.41-130.46-305.202-100.886 7.94-81.11 321.853 81.444-6.41zm29.021-126.438l26.004-113.878 2.449-.193 43.652 108.396-72.105 5.675z"),o(t,"class","fill-white dark:fill-rich-purple-900"),o(s,"class","h-36 w-36 rounded svelte-12qkcbw"),o(s,"width","400"),o(s,"height","400"),o(s,"viewBox","0 0 400 400"),o(s,"fill","none"),o(s,"xmlns","http://www.w3.org/2000/svg"),h(s,"small",e[0])},m(e,r){n(e,s,r),f(s,a),f(s,t)},p(e,[t]){2&t&&h(a,"letter-color",e[1]),1&t&&h(s,"small",e[0])},i:p,o:p,d(e){e&&c(s)}}}function L(e,s,a){let{small:t=!1}=s,{color:r=!1}=s;return e.$$set=e=>{"small"in e&&a(0,t=e.small),"color"in e&&a(1,r=e.color)},[t,r]}class N extends s{constructor(e){super(),a(this,e,L,S,t,{small:0,color:1})}}function z(e){let s,a,t,r,p,A,y,I,M,S,L,z,B,C,T,D,F,V,_,j,H,K,O,q,G,P;return A=new N({props:{color:!0}}),{c(){s=v("header"),a=v("nav"),t=v("ul"),r=v("li"),p=v("a"),u(A.$$.fragment),y=d(),I=v("li"),M=v("a"),S=g("Back"),L=d(),z=v("li"),B=v("a"),C=g("About me"),T=d(),D=v("li"),F=v("a"),V=g("Work"),_=d(),j=v("li"),H=v("a"),K=g("Contact"),O=d(),q=v("button"),G=g("Menu"),this.h()},l(e){s=l(e,"HEADER",{class:!0});var o=i(s);a=l(o,"NAV",{class:!0});var h=i(a);t=l(h,"UL",{class:!0});var n=i(t);r=l(n,"LI",{class:!0});var f=i(r);p=l(f,"A",{"sveltekit:prefetch":!0,href:!0,"aria-label":!0});var v=i(p);m(A.$$.fragment,v),v.forEach(c),f.forEach(c),y=b(n),I=l(n,"LI",{class:!0});var u=i(I);M=l(u,"A",{"sveltekit:prefetch":!0,href:!0});var d=i(M);S=$(d,"Back"),d.forEach(c),u.forEach(c),L=b(n),z=l(n,"LI",{class:!0});var g=i(z);B=l(g,"A",{"sveltekit:prefetch":!0,href:!0});var w=i(B);C=$(w,"About me"),w.forEach(c),g.forEach(c),T=b(n),D=l(n,"LI",{class:!0});var E=i(D);F=l(E,"A",{"sveltekit:prefetch":!0,href:!0});var k=i(F);V=$(k,"Work"),k.forEach(c),E.forEach(c),_=b(n),j=l(n,"LI",{class:!0});var x=i(j);H=l(x,"A",{"sveltekit:prefetch":!0,href:!0});var N=i(H);K=$(N,"Contact"),N.forEach(c),x.forEach(c),n.forEach(c),O=b(h),q=l(h,"BUTTON",{class:!0});var P=i(q);G=$(P,"Menu"),P.forEach(c),h.forEach(c),o.forEach(c),this.h()},h(){o(p,"sveltekit:prefetch",""),o(p,"href","/"),o(p,"aria-label","Go to homepage"),o(r,"class","visible svelte-1e7aig7"),o(M,"sveltekit:prefetch",""),o(M,"href","/"),o(I,"class","svelte-1e7aig7"),h(I,"visible","/"!==e[0].path),o(B,"sveltekit:prefetch",""),o(B,"href","#about"),o(z,"class","svelte-1e7aig7"),h(z,"visible","/"===e[0].path),o(F,"sveltekit:prefetch",""),o(F,"href","#work"),o(D,"class","svelte-1e7aig7"),h(D,"visible","/"===e[0].path),o(H,"sveltekit:prefetch",""),o(H,"href","#contact"),o(j,"class","svelte-1e7aig7"),h(j,"visible","/"===e[0].path),o(t,"class","flex items-center gap-30 text-16 w-max"),o(q,"class","flex sm:hidden"),o(a,"class","contained-width w-full xl:px-48 flex items-center justify-between svelte-1e7aig7"),o(s,"class","h-80 sm:h-100 flex items-center px-30 sm:px-48 fixed top-0 left-0 right-0 bg-white bg-opacity-90 dark:bg-rich-purple-900 dark:bg-opacity-90 backdrop-blur-lg z-10")},m(e,l){n(e,s,l),f(s,a),f(a,t),f(t,r),f(r,p),w(A,p,null),f(t,y),f(t,I),f(I,M),f(M,S),f(t,L),f(t,z),f(z,B),f(B,C),f(t,T),f(t,D),f(D,F),f(F,V),f(t,_),f(t,j),f(j,H),f(H,K),f(a,O),f(a,q),f(q,G),P=!0},p(e,[s]){1&s&&h(I,"visible","/"!==e[0].path),1&s&&h(z,"visible","/"===e[0].path),1&s&&h(D,"visible","/"===e[0].path),1&s&&h(j,"visible","/"===e[0].path)},i(e){P||(E(A.$$.fragment,e),P=!0)},o(e){k(A.$$.fragment,e),P=!1},d(e){e&&c(s),x(A)}}}function B(e,s,a){let t;return A(e,M,(e=>a(0,t=e))),[t]}class C extends s{constructor(e){super(),a(this,e,B,z,t,{})}}function T(e){let s,a,t,r,h,A,y,I,M,S,L,z,B,C,T,D,F,V,_,j,H,K;return r=new N({props:{small:!0}}),{c(){s=v("footer"),a=v("div"),t=v("div"),u(r.$$.fragment),h=d(),A=v("span"),y=g("© 2021"),I=d(),M=v("p"),S=g("Made with ❤️ in "),L=v("a"),z=g("Figma"),B=g(", built using\r\n        "),C=v("a"),T=g("SvelteKit"),D=g(" and "),F=v("a"),V=g("TailwindCSS"),_=g(", hosted on\r\n        "),j=v("a"),H=g("Netlify"),this.h()},l(e){s=l(e,"FOOTER",{class:!0});var o=i(s);a=l(o,"DIV",{class:!0});var n=i(a);t=l(n,"DIV",{class:!0});var f=i(t);m(r.$$.fragment,f),h=b(f),A=l(f,"SPAN",{});var p=i(A);y=$(p,"© 2021"),p.forEach(c),f.forEach(c),I=b(n),M=l(n,"P",{class:!0});var v=i(M);S=$(v,"Made with ❤️ in "),L=l(v,"A",{href:!0});var u=i(L);z=$(u,"Figma"),u.forEach(c),B=$(v,", built using\r\n        "),C=l(v,"A",{href:!0});var d=i(C);T=$(d,"SvelteKit"),d.forEach(c),D=$(v," and "),F=l(v,"A",{href:!0});var g=i(F);V=$(g,"TailwindCSS"),g.forEach(c),_=$(v,", hosted on\r\n        "),j=l(v,"A",{href:!0});var w=i(j);H=$(w,"Netlify"),w.forEach(c),v.forEach(c),n.forEach(c),o.forEach(c),this.h()},h(){o(t,"class","flex items-center gap-5 text-18 flex-shrink-0 mb-15"),o(L,"href","https://www.figma.com/"),o(C,"href","https://kit.svelte.dev"),o(F,"href","https://tailwindcss.com"),o(j,"href","https://netlify.com"),o(M,"class","text-12 text-gray-800 dark:text-gray-300 font-light opacity-95 w-9/12 sm:w-full"),o(a,"class","contained-width"),o(s,"class","border-t border-rich-purple-500 dark:border-rich-purple-300 border-opacity-5 dark:border-opacity-10 p-30 sm:px-60 sm:py-30 w-full")},m(e,l){n(e,s,l),f(s,a),f(a,t),w(r,t,null),f(t,h),f(t,A),f(A,y),f(a,I),f(a,M),f(M,S),f(M,L),f(L,z),f(M,B),f(M,C),f(C,T),f(M,D),f(M,F),f(F,V),f(M,_),f(M,j),f(j,H),K=!0},p:p,i(e){K||(E(r.$$.fragment,e),K=!0)},o(e){k(r.$$.fragment,e),K=!1},d(e){e&&c(s),x(r)}}}class D extends s{constructor(e){super(),a(this,e,null,T,t,{})}}function F(e){let s,a,t,r,h,f;s=new C({});const p=e[1].default,g=y(p,e,e[0],null);return h=new D({}),{c(){u(s.$$.fragment),a=d(),t=v("main"),g&&g.c(),r=d(),u(h.$$.fragment),this.h()},l(e){m(s.$$.fragment,e),a=b(e),t=l(e,"MAIN",{class:!0});var o=i(t);g&&g.l(o),o.forEach(c),r=b(e),m(h.$$.fragment,e),this.h()},h(){o(t,"class","contained-width grid grid-cols-[1.875rem,1fr,1.875rem] sm:grid-cols-[3rem,1fr,3rem]")},m(e,l){w(s,e,l),n(e,a,l),n(e,t,l),g&&g.m(t,null),n(e,r,l),w(h,e,l),f=!0},p(e,[s]){g&&g.p&&(!f||1&s)&&I(g,p,e,e[0],f?s:-1,null,null)},i(e){f||(E(s.$$.fragment,e),E(g,e),E(h.$$.fragment,e),f=!0)},o(e){k(s.$$.fragment,e),k(g,e),k(h.$$.fragment,e),f=!1},d(e){x(s,e),e&&c(a),e&&c(t),g&&g.d(e),e&&c(r),x(h,e)}}}function V(e,s,a){let{$$slots:t={},$$scope:r}=s;return e.$$set=e=>{"$$scope"in e&&a(0,r=e.$$scope)},[r,t]}export default class extends s{constructor(e){super(),a(this,e,V,F,t,{})}}
