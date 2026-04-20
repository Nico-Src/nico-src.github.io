import t from"./voronIZl.js";import{M as r,$ as o,o as s,c as l,p as i,b as d,a1 as a}from"./65q8Cmel.js";import"./6BBS80-1.js";import"./ZhWAdK_X.js";var p=`
    .p-overlaybadge {
        position: relative;
    }

    .p-overlaybadge .p-badge {
        position: absolute;
        inset-block-start: 0;
        inset-inline-end: 0;
        transform: translate(50%, -50%);
        transform-origin: 100% 0;
        margin: 0;
        outline-width: dt('overlaybadge.outline.width');
        outline-style: solid;
        outline-color: dt('overlaybadge.outline.color');
    }

    .p-overlaybadge .p-badge:dir(rtl) {
        transform: translate(-50%, -50%);
    }
`,v={root:"p-overlaybadge"},c=r.extend({name:"overlaybadge",style:p,classes:v}),g={name:"OverlayBadge",extends:t,style:c,provide:function(){return{$pcOverlayBadge:this,$parentInstance:this}}},m={name:"OverlayBadge",extends:g,inheritAttrs:!1,components:{Badge:t}};function y(e,u,b,B,$,f){var n=o("Badge");return s(),l("div",a({class:e.cx("root")},e.ptmi("root")),[i(e.$slots,"default"),d(n,a(e.$props,{pt:e.ptm("pcBadge")}),null,16,["pt"])],16)}m.render=y;export{m as default};
