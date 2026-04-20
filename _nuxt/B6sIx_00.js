import{M as g,R as p,Z as d,$ as v,o as c,c as b,F as S,r as O,i as B,a4 as w,w as L,p as A,a as V,a1 as y,t as K}from"./65q8Cmel.js";import{R}from"./DwcXKV93.js";import T from"./B1FYSIMb.js";import{s as I}from"./BteGFSj-.js";import{f as k}from"./ZhWAdK_X.js";import"./BjPnDLuE.js";import"./jc0MLXVe.js";import"./6BBS80-1.js";var D=`
    .p-selectbutton {
        display: inline-flex;
        user-select: none;
        vertical-align: bottom;
        outline-color: transparent;
        border-radius: dt('selectbutton.border.radius');
    }

    .p-selectbutton .p-togglebutton {
        border-radius: 0;
        border-width: 1px 1px 1px 0;
    }

    .p-selectbutton .p-togglebutton:focus-visible {
        position: relative;
        z-index: 1;
    }

    .p-selectbutton .p-togglebutton:first-child {
        border-inline-start-width: 1px;
        border-start-start-radius: dt('selectbutton.border.radius');
        border-end-start-radius: dt('selectbutton.border.radius');
    }

    .p-selectbutton .p-togglebutton:last-child {
        border-start-end-radius: dt('selectbutton.border.radius');
        border-end-end-radius: dt('selectbutton.border.radius');
    }

    .p-selectbutton.p-invalid {
        outline: 1px solid dt('selectbutton.invalid.border.color');
        outline-offset: 0;
    }

    .p-selectbutton-fluid {
        width: 100%;
    }
    
    .p-selectbutton-fluid .p-togglebutton {
        flex: 1 1 0;
    }
`,E={root:function(n){var t=n.props,a=n.instance;return["p-selectbutton p-component",{"p-invalid":a.$invalid,"p-selectbutton-fluid":t.fluid}]}},C=g.extend({name:"selectbutton",style:D,classes:E}),$={name:"BaseSelectButton",extends:I,props:{options:Array,optionLabel:null,optionValue:null,optionDisabled:null,multiple:Boolean,allowEmpty:{type:Boolean,default:!0},dataKey:null,ariaLabelledby:{type:String,default:null},size:{type:String,default:null},fluid:{type:Boolean,default:null}},style:C,provide:function(){return{$pcSelectButton:this,$parentInstance:this}}};function x(e,n){var t=typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(!t){if(Array.isArray(e)||(t=h(e))||n){t&&(e=t);var a=0,s=function(){};return{s,n:function(){return a>=e.length?{done:!0}:{done:!1,value:e[a++]}},e:function(u){throw u},f:s}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}var l,i=!0,r=!1;return{s:function(){t=t.call(e)},n:function(){var u=t.next();return i=u.done,u},e:function(u){r=!0,l=u},f:function(){try{i||t.return==null||t.return()}finally{if(r)throw l}}}}function _(e){return P(e)||z(e)||h(e)||q()}function q(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function h(e,n){if(e){if(typeof e=="string")return f(e,n);var t={}.toString.call(e).slice(8,-1);return t==="Object"&&e.constructor&&(t=e.constructor.name),t==="Map"||t==="Set"?Array.from(e):t==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?f(e,n):void 0}}function z(e){if(typeof Symbol<"u"&&e[Symbol.iterator]!=null||e["@@iterator"]!=null)return Array.from(e)}function P(e){if(Array.isArray(e))return f(e)}function f(e,n){(n==null||n>e.length)&&(n=e.length);for(var t=0,a=Array(n);t<n;t++)a[t]=e[t];return a}var j={name:"SelectButton",extends:$,inheritAttrs:!1,emits:["change"],methods:{getOptionLabel:function(n){return this.optionLabel?d(n,this.optionLabel):n},getOptionValue:function(n){return this.optionValue?d(n,this.optionValue):n},getOptionRenderKey:function(n){return this.dataKey?d(n,this.dataKey):this.getOptionLabel(n)},isOptionDisabled:function(n){return this.optionDisabled?d(n,this.optionDisabled):!1},isOptionReadonly:function(n){if(this.allowEmpty)return!1;var t=this.isSelected(n);return this.multiple?t&&this.d_value.length===1:t},onOptionSelect:function(n,t,a){var s=this;if(!(this.disabled||this.isOptionDisabled(t)||this.isOptionReadonly(t))){var l=this.isSelected(t),i=this.getOptionValue(t),r;if(this.multiple)if(l){if(r=this.d_value.filter(function(o){return!p(o,i,s.equalityKey)}),!this.allowEmpty&&r.length===0)return}else r=this.d_value?[].concat(_(this.d_value),[i]):[i];else{if(l&&!this.allowEmpty)return;r=l?null:i}this.writeValue(r,n),this.$emit("change",{originalEvent:n,value:r})}},isSelected:function(n){var t=!1,a=this.getOptionValue(n);if(this.multiple){if(this.d_value){var s=x(this.d_value),l;try{for(s.s();!(l=s.n()).done;){var i=l.value;if(p(i,a,this.equalityKey)){t=!0;break}}}catch(r){s.e(r)}finally{s.f()}}}else t=p(this.d_value,a,this.equalityKey);return t}},computed:{equalityKey:function(){return this.optionValue?null:this.dataKey},dataP:function(){return k({invalid:this.$invalid})}},directives:{ripple:R},components:{ToggleButton:T}},F=["aria-labelledby","data-p"];function H(e,n,t,a,s,l){var i=v("ToggleButton");return c(),b("div",y({class:e.cx("root"),role:"group","aria-labelledby":e.ariaLabelledby},e.ptmi("root"),{"data-p":l.dataP}),[(c(!0),b(S,null,O(e.options,function(r,o){return c(),B(i,{key:l.getOptionRenderKey(r),modelValue:l.isSelected(r),onLabel:l.getOptionLabel(r),offLabel:l.getOptionLabel(r),disabled:e.disabled||l.isOptionDisabled(r),unstyled:e.unstyled,size:e.size,readonly:l.isOptionReadonly(r),onChange:function(m){return l.onOptionSelect(m,r,o)},pt:e.ptm("pcToggleButton")},w({_:2},[e.$slots.option?{name:"default",fn:L(function(){return[A(e.$slots,"option",{option:r,index:o},function(){return[V("span",y({ref_for:!0},e.ptm("pcToggleButton").label),K(l.getOptionLabel(r)),17)]})]}),key:"0"}:void 0]),1032,["modelValue","onLabel","offLabel","disabled","unstyled","size","readonly","onChange","pt"])}),128))],16,F)}j.render=H;export{j as default};
