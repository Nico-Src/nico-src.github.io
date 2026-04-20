import{s as e}from"./BteGFSj-.js";import{M as a,o as n,c as s,p,a1 as i}from"./65q8Cmel.js";import{s as r}from"./jc0MLXVe.js";import"./6BBS80-1.js";var u=`
    .p-radiobutton-group {
        display: inline-flex;
    }
`,d={root:"p-radiobutton-group p-component"},m=a.extend({name:"radiobuttongroup",style:u,classes:d}),c={name:"BaseRadioButtonGroup",extends:e,style:m,provide:function(){return{$pcRadioButtonGroup:this,$parentInstance:this}}},l={name:"RadioButtonGroup",extends:c,inheritAttrs:!1,data:function(){return{groupName:this.name}},watch:{name:function(o){this.groupName=o||r("radiobutton-group-")}},mounted:function(){this.groupName=this.groupName||r("radiobutton-group-")}};function f(t,o,g,h,$,v){return n(),s("div",i({class:t.cx("root")},t.ptmi("root")),[p(t.$slots,"default")],16)}l.render=f;export{l as default};
